import { Request, Response, NextFunction } from "express";
import * as chatService from "../services/chatService";
import { ApiError } from "../utils/ApiError";

export async function getConversations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const workspaceId = req.workspace!.id;

    const conversations = await chatService.getUserConversations(workspaceId, userId);

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrCreateDirect(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const currentUserId = req.user!.userId;
    const workspaceId = req.workspace!.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      throw ApiError.badRequest("يجب تحديد العضو المراد محادثته.");
    }

    const conversation = await chatService.getOrCreateDirectConversation(
      workspaceId,
      currentUserId,
      targetUserId
    );

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
}

export async function createGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const creatorUserId = req.user!.userId;
    const workspaceId = req.workspace!.id;
    const { title, memberUserIds } = req.body;

    if (!title || !Array.isArray(memberUserIds)) {
      throw ApiError.badRequest("البيانات المدخلة غير صحيحة.");
    }

    const group = await chatService.createGroupConversation(
      workspaceId,
      creatorUserId,
      title,
      memberUserIds
    );

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const workspaceId = req.workspace!.id;
    const conversationId = req.params.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 40;
    const before = (req.query.before as string) || undefined;

    const messages = await chatService.getConversationMessages(
      workspaceId,
      userId,
      conversationId,
      limit,
      before
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const senderId = req.user!.userId;
    const workspaceId = req.workspace!.id;
    const conversationId = req.params.id;
    const { content } = req.body;

    if (!content) {
      throw ApiError.badRequest("محتوى الرسالة مطلوب.");
    }

    const message = await chatService.sendMessage(
      workspaceId,
      senderId,
      conversationId,
      content
    );

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const workspaceId = req.workspace!.id;
    const conversationId = req.params.id;

    const result = await chatService.markConversationAsRead(
      workspaceId,
      userId,
      conversationId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPresence(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const workspaceId = req.workspace!.id;

    const presences = await chatService.getWorkspacePresence(workspaceId, userId);

    res.json({
      success: true,
      data: presences,
    });
  } catch (error) {
    next(error);
  }
}

export async function initiateCall(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const callerId = req.user!.userId;
    const workspaceId = req.workspace!.id;
    const { conversationId, type } = req.body;

    if (!conversationId || (type !== "audio" && type !== "video")) {
      throw ApiError.badRequest("يجب تحديد المحادثة ونوع الاتصال (صوتي أو مرئي).");
    }

    const call = await chatService.initiateCall(
      workspaceId,
      callerId,
      conversationId,
      type
    );

    res.json({
      success: true,
      data: call,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCall(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const workspaceId = req.workspace!.id;
    const callId = req.params.id;
    const { status } = req.body;

    const validStatuses = ["active", "ended", "missed", "rejected", "busy"];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest("حالة المكالمة غير صالحة.");
    }

    const call = await chatService.updateCallStatus(
      workspaceId,
      userId,
      callId,
      status
    );

    res.json({
      success: true,
      data: call,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCallToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const workspaceId = req.workspace!.id;
    const callId = req.params.id;

    const tokenData = await chatService.generateLiveKitToken(
      workspaceId,
      userId,
      callId
    );

    res.json({
      success: true,
      data: tokenData,
    });
  } catch (error) {
    next(error);
  }
}
