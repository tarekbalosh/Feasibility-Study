import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sanitizeMessageContent,
  assertWorkspaceMembership,
  assertConversationMembership,
  getConversationMessages,
  sendMessage,
  generateLiveKitToken,
  getOrCreateDirectConversation,
} from "../src/services/chatService";
import { prisma } from "../src/config/prisma";
import { ApiError } from "../src/utils/ApiError";

// محاكاة استدعاءات Prisma لعزل منطق الصلاحيات والأمان
vi.mock("../src/config/prisma", () => ({
  prisma: {
    workspaceMember: {
      findFirst: vi.fn(),
    },
    conversationMember: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    conversation: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    call: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

describe("Chat & Calls Security & Permissions Tests", () => {
  const workspaceA = "ws-alpha";
  const workspaceB = "ws-beta";
  const userA = "user-in-workspace-a";
  const userB = "user-in-workspace-b";
  const userC = "user-c-in-workspace-a";
  const convInWsA = "conv-100";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. XSS Input Sanitization", () => {
    it("ينظف نصوص الرسائل ويجردها تماماً من وسوم الـ script والـ HTML", () => {
      const maliciousInput = "<script>alert('hacked')</script>مرحباً <b>فريق العمل</b>";
      const sanitized = sanitizeMessageContent(maliciousInput);
      expect(sanitized).toBe("مرحباً فريق العمل");
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("<b>");
    });

    it("يرفض الرسائل الفارغة بعد التنقية", () => {
      expect(() => sanitizeMessageContent("   <p></p>   ")).toThrow(ApiError);
    });
  });

  describe("2. Workspace Membership Isolation", () => {
    it("يسمح فقط لأعضاء مساحة العمل الفعّالين بالوصول", async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValueOnce({
        id: "mem-1",
        workspaceId: workspaceA,
        userId: userA,
        role: "member",
        status: "active",
        email: "user@test.com",
        invitedAt: new Date(),
        joinedAt: new Date(),
      });

      const member = await assertWorkspaceMembership(workspaceA, userA);
      expect(member).toBeDefined();
      expect(member.workspaceId).toBe(workspaceA);
    });

    it("يرفض مستخدم من مساحة عمل أخرى (403 Forbidden)", async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValueOnce(null);

      await expect(assertWorkspaceMembership(workspaceA, userB)).rejects.toThrow(
        "ليس لديك صلاحية الوصول إلى مساحة العمل هذه."
      );
    });
  });

  describe("3. Conversation Access & Message Reading (Cross-Workspace Isolation)", () => {
    it("يمنع مستخدم من مساحة عمل أخرى من قراءة رسائل المحادثة", async () => {
      // المحادثة تنتمي لمساحة عمل A والمستخدم يحاول القراءة من مساحة عمل B
      vi.mocked(prisma.conversationMember.findFirst).mockResolvedValueOnce(null);

      await expect(
        getConversationMessages(workspaceB, userB, convInWsA)
      ).rejects.toThrow("أنت لست عضواً في هذه المحادثة.");

      expect(prisma.message.findMany).not.toHaveBeenCalled();
    });

    it("يمنع مستخدم داخل نفس مساحة العمل لكنه ليس عضواً في المحادثة الخاصة من القراءة", async () => {
      vi.mocked(prisma.conversationMember.findFirst).mockResolvedValueOnce(null);

      await expect(
        assertConversationMembership(convInWsA, "other-user-in-ws-a", workspaceA)
      ).rejects.toThrow("أنت لست عضواً في هذه المحادثة.");
    });
  });

  describe("4. Sending Messages Security", () => {
    it("يرفض إرسال رسالة من مستخدم خارجي حتى لو خمّن معرف المحادثة", async () => {
      vi.mocked(prisma.conversationMember.findFirst).mockResolvedValueOnce(null);

      await expect(
        sendMessage(workspaceA, userB, convInWsA, "محاولة اختراق")
      ).rejects.toThrow("أنت لست عضواً في هذه المحادثة.");

      expect(prisma.message.create).not.toHaveBeenCalled();
    });
  });

  describe("5. Calls & LiveKit Token Isolation", () => {
    it("يمنع مستخدم من مساحة عمل أخرى من توليد توكن LiveKit أو الانضمام لمكالمة في مساحة عمل مختلفة", async () => {
      const callInWsA = "call-999";

      // المكالمة في مساحة العمل A
      vi.mocked(prisma.call.findUnique).mockResolvedValueOnce({
        id: callInWsA,
        conversationId: convInWsA,
        workspaceId: workspaceA,
        callerId: userA,
        type: "video",
        status: "active",
        roomName: "room_alpha",
        startedAt: new Date(),
        endedAt: null,
        createdAt: new Date(),
        conversation: {
          id: convInWsA,
          workspaceId: workspaceA,
          type: "direct",
          title: null,
          createdById: userA,
          lastMessageAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as any);

      // طلب التوكن من مساحة العمل B
      await expect(
        generateLiveKitToken(workspaceB, userB, callInWsA)
      ).rejects.toThrow("المكالمة غير موجودة.");
    });
  });

  describe("6. Direct Conversation Permissions & Idempotency", () => {
    it("يرفض بدء محادثة المستخدم مع نفسه (400 Bad Request)", async () => {
      await expect(
        getOrCreateDirectConversation(workspaceA, userA, userA)
      ).rejects.toThrow("لا يمكنك بدء محادثة مع نفسك.");
    });

    it("يرفض بدء محادثة مع مستخدم خارج مساحة العمل (403 Forbidden)", async () => {
      // الفاعل عضو نشط
      vi.mocked(prisma.workspaceMember.findFirst)
        .mockResolvedValueOnce({
          id: "mem-1",
          workspaceId: workspaceA,
          userId: userA,
          role: "member",
          status: "active",
          email: "userA@test.com",
          invitedAt: new Date(),
          joinedAt: new Date(),
        })
        // الطرف الآخر ليس عضواً في مساحة العمل
        .mockResolvedValueOnce(null);

      await expect(
        getOrCreateDirectConversation(workspaceA, userA, "user-outside")
      ).rejects.toThrow("ليس لديك صلاحية الوصول إلى مساحة العمل هذه.");
    });

    it("يرفض بدء محادثة مع مستخدم دعوته معلّقة وغير نشطة (403 Forbidden)", async () => {
      // الفاعل عضو نشط
      vi.mocked(prisma.workspaceMember.findFirst)
        .mockResolvedValueOnce({
          id: "mem-1",
          workspaceId: workspaceA,
          userId: userA,
          role: "member",
          status: "active",
          email: "userA@test.com",
          invitedAt: new Date(),
          joinedAt: new Date(),
        })
        // الطرف الآخر معلّق (null لأن شرط البحث status: active)
        .mockResolvedValueOnce(null);

      await expect(
        getOrCreateDirectConversation(workspaceA, userA, "user-pending")
      ).rejects.toThrow("ليس لديك صلاحية الوصول إلى مساحة العمل هذه.");
    });

    it("يفتح المحادثة الموجودة مسبقاً بأمان دون إنشاء نسخة مكررة (Idempotent)", async () => {
      // كلا العضوين نشطين في مساحة العمل
      vi.mocked(prisma.workspaceMember.findFirst)
        .mockResolvedValueOnce({
          id: "mem-1",
          workspaceId: workspaceA,
          userId: userA,
          role: "member",
          status: "active",
          email: "userA@test.com",
          invitedAt: new Date(),
          joinedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: "mem-2",
          workspaceId: workspaceA,
          userId: userC,
          role: "member",
          status: "active",
          email: "userC@test.com",
          invitedAt: new Date(),
          joinedAt: new Date(),
        });

      const existingConv = {
        id: "conv-existing-123",
        workspaceId: workspaceA,
        type: "direct",
        createdById: userA,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [],
        messages: [],
      } as any;

      vi.mocked(prisma.conversation.findFirst).mockResolvedValueOnce(existingConv);

      const result = await getOrCreateDirectConversation(workspaceA, userA, userC);

      expect(result.id).toBe("conv-existing-123");
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });

    it("ينشئ محادثة جديدة إذا لم تكن موجودة مسبقاً دون إرسال رسائل", async () => {
      // كلا العضوين نشطين
      vi.mocked(prisma.workspaceMember.findFirst)
        .mockResolvedValueOnce({
          id: "mem-1",
          workspaceId: workspaceA,
          userId: userA,
          role: "member",
          status: "active",
          email: "userA@test.com",
          invitedAt: new Date(),
          joinedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: "mem-2",
          workspaceId: workspaceA,
          userId: userC,
          role: "member",
          status: "active",
          email: "userC@test.com",
          invitedAt: new Date(),
          joinedAt: new Date(),
        });

      // لا توجد محادثة مسبقة
      vi.mocked(prisma.conversation.findFirst).mockResolvedValueOnce(null);

      const createdConv = {
        id: "conv-new-456",
        workspaceId: workspaceA,
        type: "direct",
        createdById: userA,
        members: [],
        messages: [],
      } as any;

      vi.mocked(prisma.conversation.create).mockResolvedValueOnce(createdConv);

      const result = await getOrCreateDirectConversation(workspaceA, userA, userC);

      expect(result.id).toBe("conv-new-456");
      expect(prisma.conversation.create).toHaveBeenCalledTimes(1);
    });
  });
});
