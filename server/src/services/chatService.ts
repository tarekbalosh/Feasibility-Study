import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import sanitizeHtml from "sanitize-html";
import { AccessToken } from "livekit-server-sdk";
import { env } from "../config/env";
import { isUserInChat } from "../socket/presenceTracker";

/** تنقية النص من أي كود HTML أو وسوم خبيثة */
export function sanitizeMessageContent(content: string): string {
  const clean = sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (!clean) {
    throw ApiError.badRequest("لا يمكن إرسال رسالة فارغة.");
  }
  if (clean.length > 2000) {
    throw ApiError.badRequest("الحد الأقصى لطول الرسالة هو 2000 حرف.");
  }
  return clean;
}

/** التحقق من أن المستخدم عضو فعّال داخل مساحة العمل */
export async function assertWorkspaceMembership(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
      status: "active",
    },
  });

  if (!membership) {
    throw ApiError.accessDenied("ليس لديك صلاحية الوصول إلى مساحة العمل هذه.");
  }
  return membership;
}

/** التحقق من أن المستخدم عضو في المحادثة المحددة */
export async function assertConversationMembership(
  conversationId: string,
  userId: string,
  workspaceId: string
) {
  const member = await prisma.conversationMember.findFirst({
    where: {
      conversationId,
      userId,
      conversation: {
        workspaceId,
      },
    },
    include: {
      conversation: true,
    },
  });

  if (!member) {
    throw ApiError.accessDenied("أنت لست عضواً في هذه المحادثة.");
  }
  return member;
}

/** جلب كل محادثات المستخدم داخل مساحة العمل مع عداد غير المقروء */
export async function getUserConversations(workspaceId: string, userId: string) {
  await assertWorkspaceMembership(workspaceId, userId);

  const memberships = await prisma.conversationMember.findMany({
    where: {
      userId,
      conversation: {
        workspaceId,
      },
    },
    include: {
      conversation: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          calls: {
            where: {
              status: { in: ["ringing", "active"] },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      conversation: {
        updatedAt: "desc",
      },
    },
  });

  // حساب الرسائل غير المقروءة لكل محادثة
  const conversationsWithUnread = await Promise.all(
    memberships.map(async (m) => {
      const conv = m.conversation;
      const lastReadAt = m.lastReadAt || new Date(0);

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          createdAt: { gt: lastReadAt },
          senderId: { not: userId },
        },
      });

      return {
        id: conv.id,
        type: conv.type,
        title: conv.title,
        workspaceId: conv.workspaceId,
        lastMessageAt: conv.lastMessageAt || conv.createdAt,
        unreadCount,
        lastMessage: conv.messages[0] || null,
        activeCall: conv.calls[0] || null,
        members: conv.members.map((cm) => ({
          id: cm.id,
          userId: cm.userId,
          role: cm.role,
          name: cm.user.name,
          email: cm.user.email,
          lastReadAt: cm.lastReadAt,
        })),
      };
    })
  );

  return conversationsWithUnread;
}

/** فتح أو إنشاء محادثة ثنائية مباشرة بين عضوين في نفس مساحة العمل */
export async function getOrCreateDirectConversation(
  workspaceId: string,
  currentUserId: string,
  targetUserId: string
) {
  if (currentUserId === targetUserId) {
    throw ApiError.badRequest("لا يمكنك بدء محادثة مع نفسك.");
  }

  await assertWorkspaceMembership(workspaceId, currentUserId);
  await assertWorkspaceMembership(workspaceId, targetUserId);

  // البحث عن محادثة ثنائية مشتركة مسبقاً
  const existing = await prisma.conversation.findFirst({
    where: {
      workspaceId,
      type: "direct",
      AND: [
        { members: { some: { userId: currentUserId } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (existing) {
    return existing;
  }

  // إنشاء محادثة ثنائية جديدة
  const newConversation = await prisma.conversation.create({
    data: {
      workspaceId,
      type: "direct",
      createdById: currentUserId,
      members: {
        create: [
          { userId: currentUserId, role: "admin", lastReadAt: new Date() },
          { userId: targetUserId, role: "member" },
        ],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      messages: true,
    },
  });

  return newConversation;
}

/** إنشاء مجموعة محادثة صغيرة بين أعضاء مساحة العمل */
export async function createGroupConversation(
  workspaceId: string,
  creatorUserId: string,
  title: string,
  memberUserIds: string[]
) {
  const cleanTitle = (title || "").trim();
  if (!cleanTitle) {
    throw ApiError.badRequest("يجب تحديد اسم للمجموعة.");
  }

  await assertWorkspaceMembership(workspaceId, creatorUserId);

  // تصفية المعرفات والتحقق من عدم التكرار
  const uniqueMemberIds = Array.from(new Set([...memberUserIds, creatorUserId]));
  if (uniqueMemberIds.length < 2) {
    throw ApiError.badRequest("يجب اختيار عضو واحد على الأقل بالإضافة إليك.");
  }

  // التحقق من أن كل الأعضاء ينتمون لمساحة العمل
  for (const uid of uniqueMemberIds) {
    await assertWorkspaceMembership(workspaceId, uid);
  }

  const group = await prisma.conversation.create({
    data: {
      workspaceId,
      type: "group",
      title: cleanTitle,
      createdById: creatorUserId,
      members: {
        create: uniqueMemberIds.map((uid) => ({
          userId: uid,
          role: uid === creatorUserId ? "admin" : "member",
          lastReadAt: uid === creatorUserId ? new Date() : null,
        })),
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return group;
}

/** جلب رسائل المحادثة مع دعم التصفح التدريجي (Pagination) */
export async function getConversationMessages(
  workspaceId: string,
  userId: string,
  conversationId: string,
  limit = 40,
  before?: string
) {
  await assertConversationMembership(conversationId, userId, workspaceId);

  const whereClause: any = {
    conversationId,
  };

  if (before) {
    const beforeMessage = await prisma.message.findUnique({
      where: { id: before },
      select: { createdAt: true },
    });
    if (beforeMessage) {
      whereClause.createdAt = { lt: beforeMessage.createdAt };
    }
  }

  const messages = await prisma.message.findMany({
    where: whereClause,
    take: Math.min(limit, 100),
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // عكس الترتيب ليكون تصاعدياً عند العرض
  return messages.reverse();
}

/** إرسال رسالة نصية داخل المحادثة */
export async function sendMessage(
  workspaceId: string,
  senderId: string,
  conversationId: string,
  content: string
) {
  const cleanContent = sanitizeMessageContent(content);
  await assertConversationMembership(conversationId, senderId, workspaceId);

  const now = new Date();

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: cleanContent,
        createdAt: now,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: now,
        updatedAt: now,
      },
    }),
    prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: senderId,
        },
      },
      data: {
        lastReadAt: now,
      },
    }),
  ]);

  return message;
}

/** تحديد المحادثة كمقروءة */
export async function markConversationAsRead(
  workspaceId: string,
  userId: string,
  conversationId: string
) {
  await assertConversationMembership(conversationId, userId, workspaceId);

  await prisma.conversationMember.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  return { success: true };
}

/** جلب حالة تواجد أعضاء مساحة العمل */
export async function getWorkspacePresence(workspaceId: string, userId: string) {
  await assertWorkspaceMembership(workspaceId, userId);

  // نجلب جميع أعضاء مساحة العمل الفعّالين
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId, status: "active" },
    select: { userId: true },
  });

  const memberUserIds = members.map((m) => m.userId).filter((id): id is string => Boolean(id));

  const presences = await prisma.userPresence.findMany({
    where: {
      userId: { in: memberUserIds },
    },
  });

  const presenceMap: Record<string, { status: string; lastSeenAt: Date }> = {};
  for (const p of presences) {
    presenceMap[p.userId] = {
      status: p.status,
      lastSeenAt: p.lastSeenAt,
    };
  }

  // دمج حالة المتواجدين في الذاكرة الحية (Live In-Memory Socket State) لضمان الدقة الفورية
  for (const memberId of memberUserIds) {
    if (isUserInChat(workspaceId, memberId)) {
      presenceMap[memberId] = {
        status: "online",
        lastSeenAt: new Date(),
      };
    }
  }

  return presenceMap;
}

/** تحديث حالة تواجد المستخدم في مساحة العمل */
export async function updateUserPresence(
  workspaceId: string,
  userId: string,
  status: "online" | "offline"
) {
  return await prisma.userPresence.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      workspaceId,
      status,
      lastSeenAt: new Date(),
    },
    update: {
      workspaceId,
      status,
      lastSeenAt: new Date(),
    },
  });
}

/** إنشاء جلسة مكالمة صوتية أو مرئية */
export async function initiateCall(
  workspaceId: string,
  callerId: string,
  conversationId: string,
  type: "audio" | "video"
) {
  await assertConversationMembership(conversationId, callerId, workspaceId);

  // التحقق إن كان هناك مكالمة جارية بالفعل في المحادثة
  const existingActiveCall = await prisma.call.findFirst({
    where: {
      conversationId,
      status: { in: ["ringing", "active"] },
    },
  });

  if (existingActiveCall) {
    return existingActiveCall;
  }

  const roomName = `call_${conversationId}_${Date.now()}`;

  const call = await prisma.call.create({
    data: {
      conversationId,
      workspaceId,
      callerId,
      type,
      status: "ringing",
      roomName,
    },
    include: {
      caller: {
        select: { id: true, name: true, email: true },
      },
      conversation: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
  });

  return call;
}

/** تحديث حالة المكالمة (قبول، رفض، انتهاء، مشغول) */
export async function updateCallStatus(
  workspaceId: string,
  userId: string,
  callId: string,
  status: "active" | "ended" | "missed" | "rejected" | "busy"
) {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { conversation: true },
  });

  if (!call || call.workspaceId !== workspaceId) {
    throw ApiError.notFound("المكالمة غير موجودة.");
  }

  await assertConversationMembership(call.conversationId, userId, workspaceId);

  const updateData: any = { status };
  if (status === "active" && !call.startedAt) {
    updateData.startedAt = new Date();
  }
  if (status === "ended" || status === "rejected" || status === "missed") {
    updateData.endedAt = new Date();
  }

  const updatedCall = await prisma.call.update({
    where: { id: callId },
    data: updateData,
  });

  return updatedCall;
}

/** توليد LiveKit Access Token للمكالمة */
export async function generateLiveKitToken(
  workspaceId: string,
  userId: string,
  callId: string
) {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { conversation: true },
  });

  if (!call || call.workspaceId !== workspaceId) {
    throw ApiError.notFound("المكالمة غير موجودة.");
  }

  await assertConversationMembership(call.conversationId, userId, workspaceId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) {
    throw ApiError.notFound("المستخدم غير موجود.");
  }

  const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "secret_key_at_least_32_characters_long_123456";
  const livekitUrl = process.env.LIVEKIT_URL || "ws://localhost:7880";

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: user.name,
    ttl: "1h",
  });

  at.addGrant({
    roomJoin: true,
    room: call.roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  return {
    token,
    url: livekitUrl,
    roomName: call.roomName,
  };
}
