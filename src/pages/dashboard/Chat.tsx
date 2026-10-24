import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useChat } from "@/context/ChatContext";
import { useCall } from "@/context/CallContext";
import * as workspaceService from "@/services/workspace.service";
import type { WorkspaceMember } from "@/types/workspace";
import type { ChatMessage, ConversationItem } from "@/services/chat.service";
import { NewGroupModal } from "@/components/chat/NewGroupModal";
import {
  Search,
  Plus,
  Phone,
  Video,
  Send,
  MessageSquare,
  Users,
  User,
  ArrowRight,
  Check,
  CheckCheck,
  Circle,
  Clock,
  Loader2,
} from "lucide-react";

// دالة تنسيق التاريخ لتقسيم الرسائل حسب اليوم
function getDayDividerText(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return "اليوم";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "أمس";

  return d.toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "long",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const {
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    presences,
    typingUsers,
    selectConversation,
    sendMessage,
    sendTyping,
    loadMoreMessages,
    startDirectConversation,
    createNewGroup,
  } = useChat();

  const { startCall } = useCall();

  const [activeTab, setActiveTab] = useState<"conversations" | "members">("conversations");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // جلب أعضاء مساحة العمل
  useEffect(() => {
    if (workspace?.id) {
      workspaceService
        .getWorkspaceMembers(workspace.id)
        .then((members) => {
          setWorkspaceMembers(members.filter((m) => m.status === "active"));
        })
        .catch(console.error);
    }
  }, [workspace?.id]);

  // التمرير التلقائي لأسفل عند وصول رسالة جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeConversationId]);

  // معالجة الكتابة ومؤشر "يكتب الآن"
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    sendTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    try {
      setIsSending(true);
      setInputText("");
      sendTyping(false);
      await sendMessage(trimmed);
    } catch (err) {
      console.error("فشل إرسال الرسالة:", err);
    } finally {
      setIsSending(false);
    }
  };

  // فلترة المحادثات بالبحث
  const filteredConversations = conversations.filter((c) => {
    const title =
      c.type === "group"
        ? c.title || ""
        : c.members.find((m) => m.userId !== user?.id)?.name || "";
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // فلترة أعضاء مساحة العمل بالبحث
  const filteredMembers = workspaceMembers.filter((m) => {
    if (m.userId === user?.id) return false;
    const name = m.name || m.email;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // استخراج اسم وعنوان المحادثة النشطة
  const activeChatTitle = activeConversation
    ? activeConversation.type === "group"
      ? activeConversation.title || "مجموعة"
      : activeConversation.members.find((m) => m.userId !== user?.id)?.name || "زميل العمل"
    : "";

  const otherMemberInDirect =
    activeConversation?.type === "direct"
      ? activeConversation.members.find((m) => m.userId !== user?.id)
      : null;

  const isOtherMemberOnline =
    otherMemberInDirect?.userId &&
    presences[otherMemberInDirect.userId]?.status === "online";

  return (
    <DashboardLayout>
      <Head>
        <title>الدردشة والمكالمات | جدوى</title>
      </Head>

      <div className="h-[calc(100vh-8.5rem)] flex flex-col font-cairo">
        {/* الحاوية الرئيسية للدردشة */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-0">
          
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* الجزء الأول: قائمة الأعضاء والمحادثات (Side Panel)                */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div
            className={`w-full md:w-80 lg:w-96 border-l border-gray-200 flex flex-col bg-slate-50/50 ${
              activeConversationId ? "hidden md:flex" : "flex"
            }`}
          >
            {/* الترويسة والبحث */}
            <div className="p-4 border-b border-gray-200/80 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                    <MessageSquare size={18} />
                  </span>
                  الدردشة
                </h2>
                <button
                  onClick={() => setIsNewGroupModalOpen(true)}
                  title="إنشاء مجموعة جديدة"
                  className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">مجموعة جديدة</span>
                </button>
              </div>

              {/* حقل البحث */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بالاسم..."
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-gray-100/80 border border-transparent focus:bg-white focus:border-blue-500 focus:outline-none text-xs transition-all"
                />
              </div>

              {/* التبويبات: المحادثات | الزملاء */}
              <div className="flex items-center gap-1 mt-3 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("conversations")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "conversations"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <MessageSquare size={14} />
                  <span>المحادثات</span>
                  {conversations.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                      {conversations.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("members")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "members"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Users size={14} />
                  <span>فريق العمل</span>
                  {filteredMembers.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700">
                      {filteredMembers.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* محتوى القائمة */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100/80">
              {activeTab === "conversations" ? (
                /* تبويب المحادثات */
                filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">لا توجد محادثات جارية حالياً.</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      انقر على تبويب «فريق العمل» لبدء محادثة مع أي عضو.
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = conv.id === activeConversationId;
                    const otherMember =
                      conv.type === "direct"
                        ? conv.members.find((m) => m.userId !== user?.id)
                        : null;
                    const title =
                      conv.type === "group"
                        ? conv.title || "مجموعة"
                        : otherMember?.name || "زميل العمل";
                    const isOnline =
                      otherMember?.userId &&
                      presences[otherMember.userId]?.status === "online";

                    return (
                      <div
                        key={conv.id}
                        onClick={() => selectConversation(conv.id)}
                        className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-50/80 border-r-4 border-blue-600"
                            : "hover:bg-gray-100/60"
                        }`}
                      >
                        {/* الأفاتار ومؤشر التواجد */}
                        <div className="relative shrink-0">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                              conv.type === "group"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {conv.type === "group" ? (
                              <Users size={18} />
                            ) : (
                              title.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          {conv.type === "direct" && (
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                isOnline ? "bg-emerald-500" : "bg-gray-300"
                              }`}
                            />
                          )}
                        </div>

                        {/* تفاصيل المحادثة */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {title}
                            </h4>
                            {conv.lastMessage && (
                              <span className="text-[10px] text-gray-400 shrink-0">
                                {formatMessageTime(conv.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-gray-500 truncate max-w-[160px]">
                              {conv.lastMessage
                                ? conv.lastMessage.content
                                : "لا توجد رسائل بعد"}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="min-w-4.5 h-4.5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                /* تبويب أعضاء فريق العمل */
                filteredMembers.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <User size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">لم يتم العثور على أعضاء آخرين.</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const isOnline =
                      member.userId && presences[member.userId]?.status === "online";

                    return (
                      <div
                        key={member.id}
                        onClick={async () => {
                          if (member.userId) {
                            await startDirectConversation(member.userId);
                            setActiveTab("conversations");
                          }
                        }}
                        className="p-3.5 flex items-center justify-between hover:bg-gray-100/60 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                              {(member.name || member.email).slice(0, 2).toUpperCase()}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                isOnline ? "bg-emerald-500" : "bg-gray-300"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {member.name || member.email}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {isOnline ? "متصل الآن" : "غير متصل"}
                            </p>
                          </div>
                        </div>
                        <button className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-bold">
                          <MessageSquare size={14} />
                        </button>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* الجزء الثاني: منطقة المحادثة المفتوحة (Conversation Area)       */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div
            className={`flex-1 flex flex-col bg-white min-h-0 ${
              activeConversationId ? "flex" : "hidden md:flex"
            }`}
          >
            {activeConversation ? (
              <>
                {/* ترويسة المحادثة النشطة */}
                <div className="px-4 py-3 border-b border-gray-200/80 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    {/* زر الرجوع على شاشات الجوال */}
                    <button
                      onClick={() => selectConversation(null)}
                      className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                      title="العودة للقائمة"
                    >
                      <ArrowRight size={18} />
                    </button>

                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                          activeConversation.type === "group"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {activeConversation.type === "group" ? (
                          <Users size={18} />
                        ) : (
                          activeChatTitle.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {activeConversation.type === "direct" && (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            isOtherMemberOnline ? "bg-emerald-500" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">
                        {activeChatTitle}
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        {activeConversation.type === "group"
                          ? `${activeConversation.members.length} أعضاء`
                          : isOtherMemberOnline
                          ? "متصل الآن"
                          : "غير متصل"}
                      </p>
                    </div>
                  </div>

                  {/* أزرار الاتصال الصوتي والمرئي */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startCall(activeConversation.id, "audio")}
                      title="بدء اتصال صوتي"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors shadow-xs"
                    >
                      <Phone size={18} />
                    </button>
                    <button
                      onClick={() => startCall(activeConversation.id, "video")}
                      title="بدء اتصال مرئي"
                      className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-500/20"
                    >
                      <Video size={18} />
                    </button>
                  </div>
                </div>

                {/* قائمة الرسائل مع التحميل التدريجي وفاصل الأيام */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                  {/* زر تحميل الرسائل القديمة */}
                  {hasMoreMessages && (
                    <div className="text-center pt-1 pb-2">
                      <button
                        onClick={loadMoreMessages}
                        disabled={isLoadingMessages}
                        className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 shadow-xs transition-colors"
                      >
                        {isLoadingMessages ? "جارِ التحميل..." : "تحميل الرسائل السابقة"}
                      </button>
                    </div>
                  )}

                  {messages.length === 0 && !isLoadingMessages && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                      <MessageSquare size={36} className="opacity-25 mb-2" />
                      <p className="text-xs">لا توجد رسائل في هذه المحادثة حتى الآن.</p>
                      <p className="text-[11px] text-gray-400 mt-1">ابدأ بكتابة أول رسالة بالأسفل.</p>
                    </div>
                  )}

                  {/* تجميع الرسائل حسب اليوم */}
                  {messages.map((msg, index) => {
                    const isMe = msg.senderId === user?.id;
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showDayDivider =
                      !prevMsg ||
                      getDayDividerText(msg.createdAt) !==
                        getDayDividerText(prevMsg.createdAt);

                    return (
                      <React.Fragment key={msg.id}>
                        {showDayDivider && (
                          <div className="flex items-center justify-center my-4">
                            <span className="px-3 py-1 rounded-full bg-white border border-gray-200/80 text-[11px] font-bold text-gray-500 shadow-2xs">
                              {getDayDividerText(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        <div
                          className={`flex flex-col ${
                            isMe ? "items-start" : "items-end"
                          }`}
                        >
                          {/* اسم المرسل في المجموعات */}
                          {!isMe && activeConversation.type === "group" && (
                            <span className="text-[10px] text-gray-500 font-semibold mb-1 pr-1">
                              {msg.sender.name}
                            </span>
                          )}

                          <div
                            className={`max-w-[78%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                              isMe
                                ? "bg-blue-600 text-white rounded-br-xs"
                                : "bg-white text-gray-900 border border-gray-200/80 rounded-bl-xs"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                            <div
                              className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${
                                isMe ? "text-blue-100" : "text-gray-400"
                              }`}
                            >
                              <span>{formatMessageTime(msg.createdAt)}</span>
                              {isMe && <CheckCheck size={14} className="opacity-80" />}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {/* مؤشر "يكتب الآن..." */}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 animate-pulse pt-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{typingUsers.join("، ")} يكتب الآن...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* صندوق إدخال الرسالة */}
                <form
                  onSubmit={handleSend}
                  className="p-3 border-t border-gray-200/80 bg-white flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال)"
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs sm:text-sm transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all shadow-md shadow-blue-500/20 shrink-0"
                    title="إرسال"
                  >
                    {isSending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} className="rotate-180" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* حالة عدم اختيار أي محادثة */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  مرحباً بك في دردشة الفريق
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mb-6">
                  تواصل مع زملائك في مساحة العمل عبر الرسائل النصية المباشرة والمكالمات الصوتية والمرئية.
                </p>
                <button
                  onClick={() => setActiveTab("members")}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Users size={16} />
                  <span>اختر زميلاً للبدء</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* نافذة إنشاء مجموعة جديدة */}
      <NewGroupModal
        isOpen={isNewGroupModalOpen}
        onClose={() => setIsNewGroupModalOpen(false)}
        members={workspaceMembers}
        currentUserId={user?.id || ""}
        onCreateGroup={async (title, memberUserIds) => {
          await createNewGroup(title, memberUserIds);
        }}
      />
    </DashboardLayout>
  );
}
