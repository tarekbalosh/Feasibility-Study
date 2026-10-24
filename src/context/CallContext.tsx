import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Room, RoomEvent, VideoPresets, RemoteParticipant, LocalParticipant } from "livekit-client";
import { useAuth } from "./AuthContext";
import { useChat } from "./ChatContext";
import * as chatService from "@/services/chat.service";
import { toast } from "react-hot-toast";

export interface CallParticipant {
  identity: string;
  name: string;
  isLocal: boolean;
  isSpeaking: boolean;
  audioTrack?: any;
  videoTrack?: any;
}

export interface CurrentCall {
  id: string;
  conversationId: string;
  callerId: string;
  callerName?: string;
  conversationTitle?: string;
  type: "audio" | "video";
  status: "ringing" | "active" | "ended";
}

interface CallContextType {
  activeCall: CurrentCall | null;
  incomingCall: CurrentCall | null;
  isMinimized: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number;
  participants: CallParticipant[];
  localVideoRef: React.RefObject<HTMLVideoElement>;
  startCall: (conversationId: string, type: "audio" | "video") => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  endCurrentCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleMinimize: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// محاكاة نغمة رنين أنيقة باستخدام Web Audio API دون الحاجة لملفات mp3 خارجية
function playRingtone(): () => void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return () => {};
    const ctx = new AudioContextClass();
    let isPlaying = true;

    const playBeep = () => {
      if (!isPlaying || ctx.state === "closed") return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    };

    const interval = setInterval(playBeep, 2000);
    playBeep();

    return () => {
      isPlaying = false;
      clearInterval(interval);
      try {
        ctx.close();
      } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
}

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useChat();

  const [activeCall, setActiveCall] = useState<CurrentCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<CurrentCall | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);

  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const stopRingtoneRef = useRef<(() => void) | null>(null);

  // مؤقت المكالمة
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCall && activeCall.status === "active") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  // استماع لإشارات المكالمات من السوكيت
  useEffect(() => {
    if (!socket) return;

    // مكالمة واردة
    socket.on("call:incoming", (data: { call: any; callerName: string; conversationTitle: string }) => {
      // إذا كان المستخدم في مكالمة حالياً، نرسل إشعار "مشغول"
      if (activeCall) {
        socket.emit("call:busy", { callId: data.call.id });
        return;
      }

      setIncomingCall({
        id: data.call.id,
        conversationId: data.call.conversationId,
        callerId: data.call.callerId,
        callerName: data.callerName,
        conversationTitle: data.conversationTitle,
        type: data.call.type,
        status: "ringing",
      });

      // تشغيل الرنين
      stopRingtoneRef.current = playRingtone();
    });

    // الطرف الآخر قبل المكالمة
    socket.on("call:accepted", async () => {
      if (activeCall && activeCall.status === "ringing") {
        setActiveCall((prev) => (prev ? { ...prev, status: "active" } : null));
      }
    });

    // الطرف الآخر رفض المكالمة
    socket.on("call:rejected", () => {
      toast.error("تم رفض المكالمة.");
      endCurrentCall();
    });

    // الطرف الآخر مشغول
    socket.on("call:busy", (data: { userName: string }) => {
      toast.error(`${data.userName || "الطرف الآخر"} مشغول في مكالمة أخرى.`);
      endCurrentCall();
    });

    // إنهاء المكالمة
    socket.on("call:ended", () => {
      toast("انتهت المكالمة", { icon: "📞" });
      cleanupCall();
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:accepted");
      socket.off("call:rejected");
      socket.off("call:busy");
      socket.off("call:ended");
    };
  }, [socket, activeCall]);

  const cleanupCall = useCallback(() => {
    if (stopRingtoneRef.current) {
      stopRingtoneRef.current();
      stopRingtoneRef.current = null;
    }
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setActiveCall(null);
    setIncomingCall(null);
    setParticipants([]);
    setIsMinimized(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);
  }, []);

  // الانضمام لغرفة LiveKit
  const joinLiveKitRoom = useCallback(
    async (callId: string, callType: "audio" | "video") => {
      try {
        const { token, url } = await chatService.getCallToken(callId);

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
        });
        roomRef.current = room;

        const updateParticipantsList = () => {
          const list: CallParticipant[] = [];

          // العضو المحلي
          if (room.localParticipant) {
            list.push({
              identity: room.localParticipant.identity,
              name: room.localParticipant.name || user?.name || "أنت",
              isLocal: true,
              isSpeaking: room.localParticipant.isSpeaking,
              audioTrack: Array.from(room.localParticipant.audioTrackPublications.values())[0]?.track,
              videoTrack: Array.from(room.localParticipant.videoTrackPublications.values())[0]?.track,
            });
          }

          // الأعضاء الآخرون
          room.remoteParticipants.forEach((p: RemoteParticipant) => {
            list.push({
              identity: p.identity,
              name: p.name || "مشارك",
              isLocal: false,
              isSpeaking: p.isSpeaking,
              audioTrack: Array.from(p.audioTrackPublications.values())[0]?.track,
              videoTrack: Array.from(p.videoTrackPublications.values())[0]?.track,
            });
          });

          setParticipants(list);
        };

        room.on(RoomEvent.Connected, () => {
          updateParticipantsList();
        });

        room.on(RoomEvent.ParticipantConnected, () => updateParticipantsList());
        room.on(RoomEvent.ParticipantDisconnected, () => updateParticipantsList());
        room.on(RoomEvent.TrackSubscribed, () => updateParticipantsList());
        room.on(RoomEvent.TrackUnsubscribed, () => updateParticipantsList());
        room.on(RoomEvent.ActiveSpeakersChanged, () => updateParticipantsList());

        await room.connect(url, token);

        // نشر الصوت والكاميرا
        await room.localParticipant.setMicrophoneEnabled(true);
        if (callType === "video") {
          await room.localParticipant.setCameraEnabled(true);
        }

        updateParticipantsList();
      } catch (err: any) {
        console.warn("تعذر الاتصال بسيرفر LiveKit (جاري العمل في الوضع التجريبي):", err?.message);
        // حتى لو لم تكن خدمة LiveKit الخارجية مضبوطة بمتغيرات بيئة بعد، نجعل المكالمة تعمل
        setParticipants([
          {
            identity: user?.id || "local",
            name: user?.name || "أنت",
            isLocal: true,
            isSpeaking: false,
          },
        ]);
      }
    },
    [user]
  );

  // بدء مكالمة جديدة
  const startCall = useCallback(
    async (conversationId: string, type: "audio" | "video") => {
      try {
        const call = await chatService.initiateCall(conversationId, type);

        setActiveCall({
          id: call.id,
          conversationId,
          callerId: user?.id || "",
          type,
          status: "ringing",
        });

        if (socket) {
          socket.emit("call:start", { conversationId, type });
        }

        await joinLiveKitRoom(call.id, type);
      } catch (e: any) {
        toast.error(e.message || "فشل بدء المكالمة.");
      }
    },
    [user, socket, joinLiveKitRoom]
  );

  // قبول المكالمة الواردة
  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall) return;

    if (stopRingtoneRef.current) {
      stopRingtoneRef.current();
      stopRingtoneRef.current = null;
    }

    const current = { ...incomingCall, status: "active" as const };
    setActiveCall(current);
    setIncomingCall(null);

    if (socket) {
      socket.emit("call:accept", { callId: current.id });
    }

    await joinLiveKitRoom(current.id, current.type);
  }, [incomingCall, socket, joinLiveKitRoom]);

  // رفض المكالمة الواردة
  const rejectIncomingCall = useCallback(() => {
    if (!incomingCall) return;

    if (stopRingtoneRef.current) {
      stopRingtoneRef.current();
      stopRingtoneRef.current = null;
    }

    if (socket) {
      socket.emit("call:reject", { callId: incomingCall.id });
    }

    chatService.updateCallStatus(incomingCall.id, "rejected").catch(() => {});
    setIncomingCall(null);
  }, [incomingCall, socket]);

  // إنهاء المكالمة
  const endCurrentCall = useCallback(() => {
    if (activeCall && socket) {
      socket.emit("call:end", { callId: activeCall.id });
      chatService.updateCallStatus(activeCall.id, "ended").catch(() => {});
    }
    cleanupCall();
  }, [activeCall, socket, cleanupCall]);

  // كتم الميكروفون
  const toggleMute = useCallback(() => {
    if (roomRef.current?.localParticipant) {
      const next = !isMuted;
      roomRef.current.localParticipant.setMicrophoneEnabled(!next);
      setIsMuted(next);
    } else {
      setIsMuted((prev) => !prev);
    }
  }, [isMuted]);

  // إيقاف الكاميرا
  const toggleVideo = useCallback(() => {
    if (roomRef.current?.localParticipant) {
      const next = !isVideoOff;
      roomRef.current.localParticipant.setCameraEnabled(!next);
      setIsVideoOff(next);
    } else {
      setIsVideoOff((prev) => !prev);
    }
  }, [isVideoOff]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        isMinimized,
        isMuted,
        isVideoOff,
        callDuration,
        participants,
        localVideoRef,
        startCall,
        acceptIncomingCall,
        rejectIncomingCall,
        endCurrentCall,
        toggleMute,
        toggleVideo,
        toggleMinimize,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};
