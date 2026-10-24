import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import * as chatService from "../services/chatService";
import { logger } from "../utils/logger";
import { markUserInChat, markUserLeaveChat } from "./presenceTracker";

interface SocketUser {
  userId: string;
  email: string;
  name: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
  workspaceId?: string;
  inChat?: boolean;
}

// تخزين معدل الإرسال لمنع السبام
const messageRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = messageRateLimits.get(userId);

  if (!limit || now > limit.resetAt) {
    messageRateLimits.set(userId, { count: 1, resetAt: now + 2000 });
    return true;
  }

  if (limit.count >= 6) {
    return false; // تجاوز الحد: أكثر من 6 رسائل في ثانيتين
  }

  limit.count++;
  return true;
}

let ioInstance: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  const allowedOrigins = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(",").map((o: string) => o.trim())
    : ["http://localhost:3000", "http://localhost:3001"];

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.includes("localhost")) {
          callback(null, true);
        } else {
          callback(null, true); // في بيئة التطوير نقبل الاتصال المباشر
        }
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  ioInstance = io;

  // التحقق من الهوية وصلاحية مساحة العمل عند الاتصال الأولي (Handshake)
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.split(" ")[1]
          : null);

      const workspaceId =
        socket.handshake.auth?.workspaceId ||
        (socket.handshake.headers["x-workspace-id"] as string);

      if (!token) {
        return next(new Error("AUTH_REQUIRED: رمز المصادقة مفقود."));
      }

      if (!workspaceId) {
        return next(new Error("WORKSPACE_REQUIRED: معرف مساحة العمل مفقود."));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        email: string;
      };

      // التحقق من وجود المستخدم
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return next(new Error("USER_NOT_FOUND: المستخدم غير مسجل."));
      }

      // التحقق من أن المستخدم عضو فعّال في مساحة العمل
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: user.id,
          status: "active",
        },
      });

      if (!membership) {
        return next(new Error("FORBIDDEN: لست عضواً فعّالاً في هذه المساحة."));
      }

      socket.user = {
        userId: user.id,
        name: user.name,
        email: user.email,
      };
      socket.workspaceId = workspaceId;

      next();
    } catch (err: any) {
      logger.error("فشل مصادقة WebSocket:", err?.message);
      next(new Error("AUTHENTICATION_FAILED: فشل التحقق من صلاحية الاتصال."));
    }
  });

  io.on("connection", async (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    const workspaceId = socket.workspaceId!;

    logger.info(`🔌 اتصال دردشة جديد: ${user.name} (${user.userId}) في مساحة ${workspaceId}`);

    // انضمام لغرفة المستخدم الشخصية ولغرفة مساحة العمل
    socket.join(`user:${user.userId}`);
    socket.join(`workspace:${workspaceId}`);

    // إشارة دخول صفحة الدردشة
    socket.on("presence:chat_enter", async () => {
      markUserInChat(workspaceId, user.userId);
      socket.inChat = true;
      try {
        await chatService.updateUserPresence(workspaceId, user.userId, "online");
        io.to(`workspace:${workspaceId}`).emit("presence:update", {
          userId: user.userId,
          status: "online",
          lastSeenAt: new Date(),
        });
      } catch (e) {
        logger.error("خطأ في تحديث التواجد (دخول الدردشة):", e);
      }
    });

    // إشارة مغادرة صفحة الدردشة
    socket.on("presence:chat_leave", async () => {
      const isFullyLeft = markUserLeaveChat(workspaceId, user.userId);
      socket.inChat = false;
      if (isFullyLeft) {
        try {
          await chatService.updateUserPresence(workspaceId, user.userId, "offline");
          io.to(`workspace:${workspaceId}`).emit("presence:update", {
            userId: user.userId,
            status: "offline",
            lastSeenAt: new Date(),
          });
        } catch (e) {
          logger.error("خطأ في تحديث التواجد (مغادرة الدردشة):", e);
        }
      }
    });

    // 1. الانضمام إلى غرفة محادثة
    socket.on("chat:join", async ({ conversationId }: { conversationId: string }) => {
      try {
        await chatService.assertConversationMembership(conversationId, user.userId, workspaceId);
        socket.join(`conversation:${conversationId}`);
      } catch (err: any) {
        socket.emit("error", { message: err.message || "لا يمكنك الانضمام لهذه المحادثة." });
      }
    });

    // 2. مغادرة غرفة المحادثة
    socket.on("chat:leave", ({ conversationId }: { conversationId: string }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // 3. إرسال رسالة
    socket.on(
      "chat:message",
      async (
        { conversationId, content }: { conversationId: string; content: string },
        callback?: (res: any) => void
      ) => {
        try {
          if (!checkRateLimit(user.userId)) {
            const errResponse = { success: false, error: "تم تجاوز معدل الإرسال، تمهل قليلاً." };
            if (callback) callback(errResponse);
            socket.emit("error", errResponse);
            return;
          }

          const message = await chatService.sendMessage(
            workspaceId,
            user.userId,
            conversationId,
            content
          );

          // بث الرسالة في غرفة المحادثة
          io.to(`conversation:${conversationId}`).emit("chat:message", {
            conversationId,
            message,
          });

          // إرسال إشعار وتحديث العداد لكل أعضاء المحادثة
          const conv = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { members: true },
          });

          if (conv) {
            for (const member of conv.members) {
              if (member.userId !== user.userId) {
                io.to(`user:${member.userId}`).emit("chat:notification", {
                  conversationId,
                  message,
                  senderName: user.name,
                });
              }
            }
          }

          if (callback) {
            callback({ success: true, message });
          }
        } catch (err: any) {
          logger.error("خطأ إرسال الرسالة عبر socket:", err.message);
          if (callback) {
            callback({ success: false, error: err.message });
          }
        }
      }
    );

    // 4. مؤشر "يكتب الآن..." (Typing indicator)
    socket.on(
      "chat:typing",
      ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
        socket.to(`conversation:${conversationId}`).emit("chat:typing", {
          conversationId,
          userId: user.userId,
          userName: user.name,
          isTyping,
        });
      }
    );

    // 5. تأكيد القراءة (Read Receipt)
    socket.on("chat:read", async ({ conversationId }: { conversationId: string }) => {
      try {
        const readAt = new Date();
        await chatService.markConversationAsRead(workspaceId, user.userId, conversationId);
        io.to(`conversation:${conversationId}`).emit("chat:read", {
          conversationId,
          userId: user.userId,
          readAt: readAt.toISOString(),
        });
      } catch (e) {
        // تجاهل الخطأ البسيط
      }
    });

    // 6. إشارات المكالمات (Call Signaling)
    socket.on(
      "call:start",
      async (
        { conversationId, type }: { conversationId: string; type: "audio" | "video" },
        callback?: (res: any) => void
      ) => {
        try {
          const call = await chatService.initiateCall(
            workspaceId,
            user.userId,
            conversationId,
            type
          );

          // إعلام جميع أعضاء المحادثة برنين المكالمة
          const conv = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { members: true },
          });

          if (conv) {
            for (const member of conv.members) {
              if (member.userId !== user.userId) {
                io.to(`user:${member.userId}`).emit("call:incoming", {
                  call,
                  callerName: user.name,
                  conversationTitle: conv.title || user.name,
                });
              }
            }
          }

          if (callback) callback({ success: true, call });
        } catch (err: any) {
          if (callback) callback({ success: false, error: err.message });
        }
      }
    );

    socket.on(
      "call:accept",
      async ({ callId }: { callId: string }, callback?: (res: any) => void) => {
        try {
          const call = await chatService.updateCallStatus(
            workspaceId,
            user.userId,
            callId,
            "active"
          );

          io.to(`conversation:${call.conversationId}`).emit("call:accepted", {
            callId,
            userId: user.userId,
          });

          if (callback) callback({ success: true, call });
        } catch (err: any) {
          if (callback) callback({ success: false, error: err.message });
        }
      }
    );

    socket.on(
      "call:reject",
      async ({ callId }: { callId: string }) => {
        try {
          const call = await chatService.updateCallStatus(
            workspaceId,
            user.userId,
            callId,
            "rejected"
          );

          io.to(`user:${call.callerId}`).emit("call:rejected", {
            callId,
            userId: user.userId,
          });
        } catch (e) {
          // ignore
        }
      }
    );

    socket.on(
      "call:busy",
      async ({ callId }: { callId: string }) => {
        try {
          const call = await prisma.call.findUnique({ where: { id: callId } });
          if (call) {
            io.to(`user:${call.callerId}`).emit("call:busy", {
              callId,
              userId: user.userId,
              userName: user.name,
            });
          }
        } catch (e) {
          // ignore
        }
      }
    );

    socket.on(
      "call:end",
      async ({ callId }: { callId: string }) => {
        try {
          const call = await chatService.updateCallStatus(
            workspaceId,
            user.userId,
            callId,
            "ended"
          );

          io.to(`conversation:${call.conversationId}`).emit("call:ended", {
            callId,
            endedBy: user.userId,
          });
        } catch (e) {
          // ignore
        }
      }
    );

    // 7. عند انقطاع الاتصال (Disconnect)
    socket.on("disconnect", async () => {
      logger.info(`🔌 قطع اتصال: ${user.name} (${user.userId})`);

      let isFullyLeft = false;
      if (socket.inChat) {
        isFullyLeft = markUserLeaveChat(workspaceId, user.userId);
      }

      // التحقق إن كان لديه اتصالات أخرى مفتوحة (مثلاً في تبويب آخر)
      const sockets = await io.in(`user:${user.userId}`).fetchSockets();
      if (sockets.length === 0 || isFullyLeft) {
        try {
          await chatService.updateUserPresence(workspaceId, user.userId, "offline");
          io.to(`workspace:${workspaceId}`).emit("presence:update", {
            userId: user.userId,
            status: "offline",
            lastSeenAt: new Date(),
          });
        } catch (e) {
          // ignore
        }
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error("لم تتم تهيئة Socket.IO بعد.");
  }
  return ioInstance;
}
