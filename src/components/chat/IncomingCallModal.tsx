import React from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useCall } from "@/context/CallContext";

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useCall();

  if (!incomingCall) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-cairo"
      dir="rtl"
    >
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-800 text-center flex flex-col items-center animate-fade-in-up">
        {/* أفاتار المتصل مع تأثير النبض */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xl shadow-lg ring-8 ring-blue-50 dark:ring-blue-950/50 animate-pulse">
            {incomingCall.callerName?.slice(0, 2).toUpperCase() || "مك"}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
            {incomingCall.type === "video" ? <Video size={14} /> : <Phone size={14} />}
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {incomingCall.callerName || "زميل في الفريق"}
        </h3>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
          {incomingCall.type === "video" ? "مكالمة مرئية واردة" : "مكالمة صوتية واردة"}
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
          {incomingCall.conversationTitle || "محادثة الفريق"}
        </p>

        {/* أزرار الرد والرفض */}
        <div className="flex items-center justify-center gap-6 w-full">
          {/* زر الرفض */}
          <button
            onClick={rejectIncomingCall}
            className="flex-1 py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/40 dark:text-red-400 font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <PhoneOff size={18} />
            <span>رفض</span>
          </button>

          {/* زر القبول */}
          <button
            onClick={acceptIncomingCall}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
          >
            <Phone size={18} />
            <span>قبول</span>
          </button>
        </div>
      </div>
    </div>
  );
};
