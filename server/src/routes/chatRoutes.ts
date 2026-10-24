import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireWorkspace } from "../middleware/workspaceMiddleware";
import * as chatController from "../controllers/chatController";

const router = Router();

// تطبيق الحماية والمصادقة ومساحة العمل على جميع المسارات
router.use(authMiddleware);
router.use(requireWorkspace);

// المحادثات
router.get("/conversations", chatController.getConversations);
router.post("/conversations/direct", chatController.getOrCreateDirect);
router.post("/conversations/group", chatController.createGroup);

// الرسائل
router.get("/conversations/:id/messages", chatController.getMessages);
router.post("/conversations/:id/messages", chatController.sendMessage);
router.post("/conversations/:id/read", chatController.markAsRead);

// التواجد (Presence)
router.get("/presence", chatController.getPresence);

// المكالمات (Calls)
router.post("/calls", chatController.initiateCall);
router.patch("/calls/:id", chatController.updateCall);
router.get("/calls/:id/token", chatController.getCallToken);

export default router;
