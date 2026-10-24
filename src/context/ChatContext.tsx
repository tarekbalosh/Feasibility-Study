import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useWorkspace } from "./WorkspaceContext";
import { getSocketUrl } from "@/lib/socketUrl";
import * as chatService from "@/services/chat.service";
import type {
  ConversationItem,
  ChatMessage,
  PresenceInfo,
} from "@/services/chat.service";
import { toast } from "react-hot-toast";

interface TypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface ChatContextType {
  socket: Socket | null;
  isConnected: boolean;
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  activeConversationId: string | null;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  presences: Record<string, PresenceInfo>;
  typingUsers: string[]; // أسماء من يكتبون الآن في المحادثة المفتوحة
  totalUnreadCount: number;
  selectConversation: (conversationId: string | null) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  loadMoreMessages: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  startDirectConversation: (targetUserId: string) => Promise<string>;
  createNewGroup: (title: string, memberUserIds: string[]) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const { workspace } = useWorkspace();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [presences, setPresences] = useState<Record<string, PresenceInfo>>({});
  const [typingMap, setTypingMap] = useState<Record<string, Record<string, string>>>({});

  const activeConvRef = useRef<string | null>(null);
  activeConvRef.current = activeConversationId;

  // جلب المحادثات والتواجد
  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated || !workspace?.id) return;
    try {
      const [convs, pres] = await Promise.all([
        chatService.getConversations(),
        chatService.getWorkspacePresence(),
      ]);
      setConversations(convs);
      setPresences(pres);
    } catch (e) {
      console.error("فشل جلب المحادثات:", e);
    }
  }, [isAuthenticated, workspace?.id]);

  // إعداد اتصال Socket.IO
  useEffect(() => {
    if (!isAuthenticated || !token || !workspace?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    const socketUrl = getSocketUrl();
    const s = io(socketUrl, {
      auth: {
        token,
        workspaceId: workspace.id,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    s.on("connect", () => {
      setIsConnected(true);
      refreshConversations();
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    s.on("presence:update", (data: { userId: string; status: "online" | "offline"; lastSeenAt: string }) => {
      setPresences((prev) => ({
        ...prev,
        [data.userId]: {
          status: data.status,
          lastSeenAt: data.lastSeenAt,
        },
      }));
    });

    s.on("chat:message", ({ conversationId, message }: { conversationId: string; message: ChatMessage }) => {
      // إذا كانت المحادثة مفتوحة حالياً، نضيف الرسالة ونرسل إشعار قراءة
      if (activeConvRef.current === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        s.emit("chat:read", { conversationId });
      }

      // تحديث قائمة المحادثات وترتيبها
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === conversationId);
        if (index === -1) {
          refreshConversations();
          return prev;
        }
        const updated = [...prev];
        const conv = { ...updated[index] };
        conv.lastMessage = message;
        conv.lastMessageAt = message.createdAt;
        if (activeConvRef.current !== conversationId && message.senderId !== user?.id) {
          conv.unreadCount += 1;
        }
        updated.splice(index, 1);
        return [conv, ...updated];
      });
    });

    s.on("chat:notification", (data: { conversationId: string; message: ChatMessage; senderName: string }) => {
      if (activeConvRef.current !== data.conversationId) {
        toast(
          (t) => (
            <div
              className="flex items-center gap-2 cursor-pointer font-cairo"
              onClick={() => {
                toast.dismiss(t.id);
                selectConversation(data.conversationId);
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <div>
                <p className="font-bold text-xs text-blue-900">{data.senderName}</p>
                <p className="text-xs text-gray-600 truncate max-w-[200px]">{data.message.content}</p>
              </div>
            </div>
          ),
          {
            duration: 4000,
            position: "bottom-right",
            style: { direction: "rtl", borderRadius: "1rem" },
          }
        );
      }
    });

    s.on("chat:typing", (data: TypingEvent) => {
      setTypingMap((prev) => {
        const convMap = { ...(prev[data.conversationId] || {}) };
        if (data.isTyping) {
          convMap[data.userId] = data.userName;
        } else {
          delete convMap[data.userId];
        }
        return {
          ...prev,
          [data.conversationId]: convMap,
        };
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthenticated, token, workspace?.id]);

  // اختيار محادثة لفتحها
  const selectConversation = useCallback(
    async (id: string | null) => {
      if (!id) {
        if (socket && activeConversationId) {
          socket.emit("chat:leave", { conversationId: activeConversationId });
        }
        setActiveConversationId(null);
        setMessages([]);
        return;
      }

      if (socket && activeConversationId && activeConversationId !== id) {
        socket.emit("chat:leave", { conversationId: activeConversationId });
      }

      setActiveConversationId(id);
      setIsLoadingMessages(true);
      setHasMoreMessages(true);

      // العثور على بيانات المحادثة وتعيينها
      let match = conversations.find((c) => c.id === id);
      if (match) {
        setActiveConversation(match);
      }

      if (socket) {
        socket.emit("chat:join", { conversationId: id });
        socket.emit("chat:read", { conversationId: id });
      }

      try {
        const [msgs, freshConvs] = await Promise.all([
          chatService.getConversationMessages(id, 40),
          match ? Promise.resolve(null) : chatService.getConversations(),
        ]);

        if (freshConvs) {
          setConversations(freshConvs);
          const found = freshConvs.find((c) => c.id === id);
          if (found) setActiveConversation(found);
        }

        setMessages(msgs);
        setHasMoreMessages(msgs.length >= 40);

        // تصفير عداد غير المقروء في الواجهة
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (e) {
        console.error("فشل جلب الرسائل:", e);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [socket, activeConversationId, conversations]
  );

  // إرسال رسالة
  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeConversationId || !content.trim()) return;

      if (socket && isConnected) {
        socket.emit("chat:message", {
          conversationId: activeConversationId,
          content,
        });
      } else {
        // Fallback عبر REST API إذا كان السوكيت مفصولاً
        const msg = await chatService.sendChatMessage(activeConversationId, content);
        setMessages((prev) => [...prev, msg]);
      }
    },
    [activeConversationId, socket, isConnected]
  );

  // إرسال حالة "يكتب الآن"
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !activeConversationId) return;
      socket.emit("chat:typing", {
        conversationId: activeConversationId,
        isTyping,
      });
    },
    [socket, activeConversationId]
  );

  // تحميل الرسائل القديمة (Pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!activeConversationId || isLoadingMessages || !hasMoreMessages || messages.length === 0) {
      return;
    }

    const oldestId = messages[0].id;
    try {
      const older = await chatService.getConversationMessages(activeConversationId, 40, oldestId);
      if (older.length === 0) {
        setHasMoreMessages(false);
      } else {
        setMessages((prev) => [...older, ...prev]);
        setHasMoreMessages(older.length >= 40);
      }
    } catch (e) {
      console.error("فشل تحميل الرسائل القديمة:", e);
    }
  }, [activeConversationId, isLoadingMessages, hasMoreMessages, messages]);

  // بدء محادثة ثنائية
  const startDirectConversation = useCallback(
    async (targetUserId: string): Promise<string> => {
      const conv = await chatService.getOrCreateDirectConversation(targetUserId);
      await refreshConversations();
      await selectConversation(conv.id);
      return conv.id;
    },
    [refreshConversations, selectConversation]
  );

  // إنشاء مجموعة جديدة
  const createNewGroup = useCallback(
    async (title: string, memberUserIds: string[]): Promise<string> => {
      const group = await chatService.createGroupConversation(title, memberUserIds);
      await refreshConversations();
      await selectConversation(group.id);
      return group.id;
    },
    [refreshConversations, selectConversation]
  );

  const typingUsers = activeConversationId
    ? Object.values(typingMap[activeConversationId] || {})
    : [];

  const totalUnreadCount = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  );

  return (
    <ChatContext.Provider
      value={{
        socket,
        isConnected,
        conversations,
        activeConversation,
        activeConversationId,
        messages,
        isLoadingMessages,
        hasMoreMessages,
        presences,
        typingUsers,
        totalUnreadCount,
        selectConversation,
        sendMessage,
        sendTyping,
        loadMoreMessages,
        refreshConversations,
        startDirectConversation,
        createNewGroup,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
