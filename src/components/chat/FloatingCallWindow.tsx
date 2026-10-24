import React, { useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Users,
  Volume2,
} from "lucide-react";
import { useCall, CallParticipant } from "@/context/CallContext";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const ParticipantTrackRenderer: React.FC<{
  participant: CallParticipant;
  isMain?: boolean;
}> = ({ participant, isMain = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (participant.videoTrack && videoRef.current) {
      participant.videoTrack.attach(videoRef.current);
      return () => {
        participant.videoTrack.detach(videoRef.current!);
      };
    }
  }, [participant.videoTrack]);

  useEffect(() => {
    if (!participant.isLocal && participant.audioTrack && audioRef.current) {
      participant.audioTrack.attach(audioRef.current);
      return () => {
        participant.audioTrack.detach(audioRef.current!);
      };
    }
  }, [participant.audioTrack, participant.isLocal]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center border ${
        participant.isSpeaking
          ? "border-blue-500 ring-2 ring-blue-500/50"
          : "border-slate-700"
      } ${isMain ? "w-full h-full" : "w-24 h-24 shrink-0"}`}
    >
      {participant.videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-2 text-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
              participant.isLocal ? "bg-blue-600" : "bg-emerald-600"
            }`}
          >
            {participant.name.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-slate-300 mt-1 truncate max-w-[80px]">
            {participant.name}
          </span>
        </div>
      )}

      {/* الصوت للمشاركين البعيدين */}
      {!participant.isLocal && <audio ref={audioRef} autoPlay />}

      {/* اسم المشارك وحالة التحدث */}
      <div className="absolute bottom-1 right-1 left-1 flex items-center justify-between px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white">
        <span className="truncate max-w-[60px]">{participant.name}</span>
        {participant.isSpeaking && (
          <Volume2 size={12} className="text-blue-400 animate-pulse shrink-0" />
        )}
      </div>
    </div>
  );
};

export const FloatingCallWindow: React.FC = () => {
  const {
    activeCall,
    isMinimized,
    isMuted,
    isVideoOff,
    callDuration,
    participants,
    toggleMute,
    toggleVideo,
    toggleMinimize,
    endCurrentCall,
  } = useCall();

  if (!activeCall) return null;

  const isRinging = activeCall.status === "ringing";
  const mainParticipant = participants.find((p) => !p.isLocal) || participants[0];
  const otherParticipants = participants.filter((p) => p !== mainParticipant);

  // الوضع المصغر (Minimized floating bar)
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 left-6 z-50 bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md flex items-center gap-3 animate-fade-in font-cairo"
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isRinging ? "bg-amber-400 animate-ping" : "bg-emerald-500"
            }`}
          />
          <div>
            <p className="text-xs font-bold leading-tight truncate max-w-[120px]">
              {activeCall.conversationTitle || "مكالمة جارية"}
            </p>
            <p className="text-[11px] text-slate-400">
              {isRinging ? "جارِ الاتصال..." : formatDuration(callDuration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-r border-slate-700 pr-2">
          <button
            onClick={toggleMute}
            title={isMuted ? "إلغاء كتم الميكروفون" : "كتم الميكروفون"}
            className={`p-2 rounded-xl transition-colors ${
              isMuted ? "bg-red-500/20 text-red-400" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {activeCall.type === "video" && (
            <button
              onClick={toggleVideo}
              title={isVideoOff ? "تشغيل الكاميرا" : "إيقاف الكاميرا"}
              className={`p-2 rounded-xl transition-colors ${
                isVideoOff ? "bg-red-500/20 text-red-400" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
            </button>
          )}

          <button
            onClick={toggleMinimize}
            title="تكبير نافذة المكالمة"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Maximize2 size={16} />
          </button>

          <button
            onClick={endCurrentCall}
            title="إنهاء المكالمة"
            className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <PhoneOff size={16} />
          </button>
        </div>
      </div>
    );
  }

  // الوضع الموسع (Expanded floating window)
  return (
    <div
      className="fixed bottom-6 left-6 z-50 w-[420px] sm:w-[480px] max-w-[95vw] h-[520px] max-h-[85vh] bg-slate-900/95 text-white rounded-3xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex flex-col overflow-hidden animate-fade-in-up font-cairo"
      dir="rtl"
    >
      {/* ترويسة نافذة المكالمة */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isRinging ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
            }`}
          />
          <div>
            <h4 className="text-sm font-bold truncate max-w-[180px]">
              {activeCall.conversationTitle || "المكالمة"}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{isRinging ? "جارِ الرنين..." : formatDuration(callDuration)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users size={12} />
                {Math.max(participants.length, 1)} مشارك
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimize}
            title="تصغير"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Minimize2 size={18} />
          </button>
        </div>
      </div>

      {/* منطقة الفيديو والشاشة الرئيسية */}
      <div className="flex-1 p-3 flex flex-col gap-2 relative overflow-hidden bg-slate-950/20">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-800/50 flex items-center justify-center">
          {mainParticipant ? (
            <ParticipantTrackRenderer participant={mainParticipant} isMain={true} />
          ) : (
            <div className="text-center p-4">
              <div className="w-16 h-16 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center mx-auto mb-2 text-xl font-bold animate-pulse">
                {activeCall.type === "video" ? <Video size={28} /> : <Mic size={28} />}
              </div>
              <p className="text-sm font-medium text-slate-300">
                {isRinging ? "في انتظار رد الطرف الآخر..." : "متصل الآن"}
              </p>
            </div>
          )}
        </div>

        {/* شريط مصغرات المشاركين في المكالمات الجماعية (مثل صورة التصميم المرفقة) */}
        {otherParticipants.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
            {otherParticipants.map((p) => (
              <ParticipantTrackRenderer key={p.identity} participant={p} isMain={false} />
            ))}
          </div>
        )}
      </div>

      {/* شريط أدوات التحكم في المكالمة */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-center gap-3">
        {/* كتم / تشغيل الميكروفون */}
        <button
          onClick={toggleMute}
          title={isMuted ? "إلغاء كتم الميكروفون" : "كتم الميكروفون"}
          className={`p-3.5 rounded-2xl transition-all shadow-md ${
            isMuted
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-slate-800 hover:bg-slate-700 text-white"
          }`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* تشغيل / إيقاف الكاميرا */}
        {activeCall.type === "video" && (
          <button
            onClick={toggleVideo}
            title={isVideoOff ? "تشغيل الكاميرا" : "إيقاف الكاميرا"}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              isVideoOff
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}

        {/* إنهاء المكالمة */}
        <button
          onClick={endCurrentCall}
          title="إنهاء المكالمة"
          className="p-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 font-bold text-sm"
        >
          <PhoneOff size={20} />
          <span>إنهاء</span>
        </button>
      </div>
    </div>
  );
};
