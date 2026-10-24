import api from "@/lib/axios";

export interface MessageSender {
  id: string;
  name: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: MessageSender;
}

export interface ConversationMemberItem {
  id: string;
  userId: string;
  role: string;
  name: string;
  email: string;
}

export interface ActiveCallSummary {
  id: string;
  type: "audio" | "video";
  status: string;
  callerId: string;
}

export interface ConversationItem {
  id: string;
  type: "direct" | "group";
  title: string | null;
  workspaceId: string;
  lastMessageAt: string;
  unreadCount: number;
  lastMessage: ChatMessage | null;
  activeCall: ActiveCallSummary | null;
  members: ConversationMemberItem[];
}

export interface PresenceInfo {
  status: "online" | "offline";
  lastSeenAt: string;
}

export async function getConversations(): Promise<ConversationItem[]> {
  const res = await api.get("/chat/conversations");
  return res.data?.data || [];
}

export async function getOrCreateDirectConversation(targetUserId: string): Promise<any> {
  const res = await api.post("/chat/conversations/direct", { targetUserId });
  return res.data?.data;
}

export async function createGroupConversation(
  title: string,
  memberUserIds: string[]
): Promise<any> {
  const res = await api.post("/chat/conversations/group", { title, memberUserIds });
  return res.data?.data;
}

export async function getConversationMessages(
  conversationId: string,
  limit = 40,
  before?: string
): Promise<ChatMessage[]> {
  const res = await api.get(`/chat/conversations/${conversationId}/messages`, {
    params: { limit, before },
  });
  return res.data?.data || [];
}

export async function sendChatMessage(
  conversationId: string,
  content: string
): Promise<ChatMessage> {
  const res = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
  return res.data?.data;
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  await api.post(`/chat/conversations/${conversationId}/read`);
}

export async function getWorkspacePresence(): Promise<Record<string, PresenceInfo>> {
  const res = await api.get("/chat/presence");
  return res.data?.data || {};
}

export async function initiateCall(
  conversationId: string,
  type: "audio" | "video"
): Promise<any> {
  const res = await api.post("/chat/calls", { conversationId, type });
  return res.data?.data;
}

export async function updateCallStatus(
  callId: string,
  status: "active" | "ended" | "missed" | "rejected" | "busy"
): Promise<any> {
  const res = await api.patch(`/chat/calls/${callId}`, { status });
  return res.data?.data;
}

export async function getCallToken(callId: string): Promise<{
  token: string;
  url: string;
  roomName: string;
}> {
  const res = await api.get(`/chat/calls/${callId}/token`);
  return res.data?.data;
}
