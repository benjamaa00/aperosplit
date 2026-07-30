import { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft, Send, Users, X, MessageCircle,
  Mic, MicOff, Play, Pause, Paperclip, Trash2, X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { AvatarImg } from "../components/AvatarImg";
import { haptics } from "../utils/haptics";
import type { Member, Conversation, ConversationMessage } from "../types";

function compressImage(file: File, maxW = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxW) { h = (h * maxW) / w; w = maxW; }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      c.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) return reject(new Error("Compression failed"));
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

export const MessagesTab = memo(function MessagesTab({
  currentMemberId,
  members,
  currency,
  isAdmin = false,
}: {
  currentMemberId: string;
  members: Member[];
  currency: string;
  isAdmin?: boolean;
}) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [swipeCancel, setSwipeCancel] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recordStartXRef = useRef(0);
  const swipeCancelRef = useRef(false);
  const recordBarRef = useRef<HTMLDivElement>(null);

  // tRPC queries
  const regularConversationsQuery = trpc.equilibra.getConversations.useQuery(
    { memberId: currentMemberId },
    { enabled: !!currentMemberId && !isAdmin, refetchInterval: 5000, staleTime: 3000 }
  );

  const adminConversationsQuery = trpc.equilibra.getAllConversations.useQuery(
    { memberId: currentMemberId },
    { enabled: !!currentMemberId && isAdmin, refetchInterval: 5000, staleTime: 3000 }
  );

  const conversationsQuery = isAdmin ? adminConversationsQuery : regularConversationsQuery;

  const messagesQuery = trpc.equilibra.getMessages.useQuery(
    { conversationId: activeConversationId || "", limit: 100 },
    { enabled: !!activeConversationId, refetchInterval: 3000, staleTime: 2000 }
  );

  const sendMessageMutation = trpc.equilibra.sendMessage.useMutation();
  const createDirectConversationMutation = trpc.equilibra.createDirectConversation.useMutation();
  const markReadMutation = trpc.equilibra.markConversationRead.useMutation();

  const conversations = conversationsQuery.data || [];
  const messages = messagesQuery.data || [];

  const activeConversation = useMemo(
    () => conversations.find((c: Conversation) => c.id === activeConversationId),
    [conversations, activeConversationId]
  );

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (activeConversationId && currentMemberId) {
      markReadMutation.mutate({ conversationId: activeConversationId, memberId: currentMemberId });
    }
  }, [activeConversationId, currentMemberId]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const doSend = useCallback(async (content: string, type: "text" | "image" | "audio" | "video" = "text") => {
    if (!activeConversationId) return;
    haptics.light();
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversationId,
        memberId: currentMemberId,
        content,
        type,
      });
      conversationsQuery.refetch();
      messagesQuery.refetch();
    } catch {
      if (type === "text") toast.error("Erreur lors de l'envoi");
    }
  }, [activeConversationId, currentMemberId, sendMessageMutation, conversationsQuery, messagesQuery]);

  const handleSendMessage = useCallback(async () => {
    if (imagePreview) {
      const img = imagePreview;
      setImagePreview(null);
      await doSend(img, "image");
      return;
    }
    if (videoPreview) {
      const vid = videoPreview;
      setVideoPreview(null);
      await doSend(vid, "video");
      return;
    }
    if (!newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage("");
    await doSend(content, "text");
  }, [newMessage, imagePreview, videoPreview, doSend]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) return;
        try {
          const compressed = await compressImage(file);
          setImagePreview(compressed);
        } catch {
          toast.error("Erreur lors du traitement de l'image");
        }
        return;
      }
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.type.startsWith("image/")) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image trop volumineuse (max 10 Mo)");
        return;
      }
      try {
        const compressed = await compressImage(file);
        setImagePreview(compressed);
      } catch {
        toast.error("Erreur lors du traitement de l'image");
      }
    } else if (file.type.startsWith("video/")) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Vidéo trop volumineuse (max 100 Mo)");
        return;
      }
      try {
        const reader = new FileReader();
        reader.onload = () => setVideoPreview(reader.result as string);
        reader.readAsDataURL(file);
      } catch {
        toast.error("Erreur lors du traitement de la vidéo");
      }
    } else {
      toast.error("Format non supporté");
    }
  }, []);

  const handleVideoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("video/")) {
      toast.error("Seules les vidéos sont acceptées");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Vidéo trop volumineuse (max 100 Mo)");
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = () => setVideoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erreur lors du traitement de la vidéo");
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioMime = ["audio/webm;codecs=opus", "audio/mp4", "audio/aac", "audio/ogg;codecs=opus"].find(t => MediaRecorder.isTypeSupported(t)) || "";
      const mr = new MediaRecorder(stream, audioMime ? { mimeType: audioMime } : undefined);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (swipeCancelRef.current || audioChunksRef.current.length === 0) {
          audioChunksRef.current = [];
          return;
        }
        const blobType = audioMime || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: blobType });
        if (blob.size < 1000) return;
        const reader = new FileReader();
        reader.onload = () => doSend(reader.result as string, "audio");
        reader.readAsDataURL(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setSwipeCancel(false);
      swipeCancelRef.current = false;
      setRecordingTime(0);
      recordStartXRef.current = 0;
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
      haptics.light();
    } catch {
      toast.error("Accès au microphone refusé");
    }
  }, [doSend]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setSwipeCancel(false);
    swipeCancelRef.current = false;
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    haptics.light();
  }, []);

  const cancelRecording = useCallback(() => {
    swipeCancelRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setSwipeCancel(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  const handleRecordPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    recordStartXRef.current = e.clientX;
    swipeCancelRef.current = false;
    startRecording();
  }, [startRecording]);

  const handleRecordPointerMove = useCallback((e: React.PointerEvent) => {
    if (!mediaRecorderRef.current) return;
    const dx = e.clientX - recordStartXRef.current;
    const cancelled = dx > 80;
    swipeCancelRef.current = cancelled;
    setSwipeCancel(cancelled);
  }, []);

  const handleRecordPointerUp = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (swipeCancelRef.current) {
      cancelRecording();
    } else {
      stopRecording();
    }
  }, [cancelRecording, stopRecording]);

  const handleStartDirectConversation = useCallback(async (targetMemberId: string) => {
    if (targetMemberId === currentMemberId) return;
    haptics.light();
    try {
      const result = await createDirectConversationMutation.mutateAsync({
        memberId: currentMemberId,
        targetMemberId,
      });
      if (result?.conversationId) {
        setActiveConversationId(result.conversationId);
        await conversationsQuery.refetch();
      } else {
        toast.error("Impossible de créer la conversation");
      }
    } catch {
      toast.error("Erreur lors de la création de la conversation");
    }
  }, [currentMemberId, createDirectConversationMutation, conversationsQuery]);

  const handleSelectGroupChat = useCallback(async () => {
    haptics.light();
    const groupConv = conversations.find((c: Conversation) => c.type === "group");
    if (groupConv) {
      setActiveConversationId(groupConv.id);
      return;
    }
    // Try refetch in case it wasn't loaded yet
    const result = await conversationsQuery.refetch();
    const gConv = (Array.isArray(result.data) ? result.data : []).find((c: Conversation) => c.type === "group");
    if (gConv) {
      setActiveConversationId(gConv.id);
    } else {
      toast.error("Impossible d'ouvrir le chat du groupe");
    }
  }, [conversations, conversationsQuery]);

  const handleBack = useCallback(() => {
    setActiveConversationId(null);
    haptics.light();
  }, []);

  const otherMembers = useMemo(
    () => members.filter((m) => m.id !== currentMemberId),
    [members, currentMemberId]
  );

  const getMemberById = useCallback(
    (id: string) => members.find((m) => m.id === id),
    [members]
  );

  const formatTime = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return d.toLocaleDateString("fr-FR", { weekday: "short" });
    }
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }, []);

  const formatRecordingTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }, []);

  // ─── RENDER ───
  return (
    <div className="flex h-full">
      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10"
          >
            <XIcon size={20} className="text-white" />
          </button>
          <img
            src={lightbox}
            alt="Aperçu"
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Vertical Profile Rail (Left Side) ── */}
      <div className="w-16 border-r border-border/30 flex flex-col items-center pt-14 pb-6 gap-3 overflow-y-auto scrollbar-hidden bg-card/10 flex-shrink-0">
        <div className="relative group">
          <button
            onClick={handleSelectGroupChat}
            className={`relative w-11 h-11 flex items-center justify-center transition-all rounded-xl ${
              activeConversation?.type === "group"
                ? "bg-primary/20 ring-2 ring-primary"
                : "bg-primary/10 hover:bg-primary/20"
            }`}
          >
            <Users size={16} className="text-primary" />
            {(conversations.find((c: Conversation) => c.type === "group")?.unreadCount || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                {conversations.find((c: Conversation) => c.type === "group")?.unreadCount}
              </span>
            )}
          </button>
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-lg bg-popover border border-border text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-[1100]">
            Groupe
          </span>
        </div>

        <div className="w-8 h-px bg-border/50" />

        {otherMembers.map((member) => {
          const memberConv = conversations.find(
            (c: Conversation) => c.type === "direct" && c.otherMemberId === member.id
          );
          const isActive = activeConversationId && memberConv && activeConversationId === memberConv.id;

          return (
            <div key={member.id} className="relative group">
              <button
                onClick={() => handleStartDirectConversation(member.id)}
                className={`relative w-11 h-11 overflow-hidden transition-all rounded-xl ${
                  isActive ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border"
                }`}
              >
                <AvatarImg avatar={member.avatar} size="text-lg" />
                {(memberConv?.unreadCount || 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                    {memberConv?.unreadCount}
                  </span>
                )}
              </button>
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-lg bg-popover border border-border text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-[1100]">
                {member.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConversationId ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <MessageCircle size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Sélectionnez un membre ou le groupe pour commencer à discuter</p>
          </div>
        ) : (
          /* ── Chat View ── */
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-3 pt-12 pb-3 border-b border-border/30 flex-shrink-0">
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-2xl bg-card/30 border border-border/50 flex items-center justify-center flex-shrink-0"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-sm truncate">
                  {activeConversation?.type === "group"
                    ? "Chat du groupe"
                    : activeConversation?.otherMemberId
                      ? getMemberById(activeConversation.otherMemberId)?.name || "Conversation privée"
                      : "Conversation privée"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {activeConversation?.type === "group"
                    ? `${members.length} membre${members.length > 1 ? "s" : ""}`
                    : "Conversation privée"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ WebkitOverflowScrolling: "touch" }}>
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Aucun message. Envoyez le premier !</p>
                </div>
              )}
              {messages.map((msg: ConversationMessage) => {
                const isMe = msg.memberId === currentMemberId;
                const author = getMemberById(msg.memberId);
                const isImage = msg.type === "image" || msg.content?.startsWith("data:image");
                const isAudio = msg.type === "audio" || msg.content?.startsWith("data:audio");
                const isVideo = msg.type === "video" || msg.content?.startsWith("data:video");
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                          : "bg-card/60 border border-border/50 rounded-2xl rounded-bl-md"
                      } ${isImage || isVideo ? "p-1 overflow-hidden" : "px-4 py-2.5"}`}
                    >
                      {!isMe && author && !isImage && !isVideo && (
                        <div className="flex items-center gap-2 mb-1.5 -ml-1">
                          <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-border/50 flex-shrink-0">
                            <AvatarImg avatar={author.avatar} size="text-xs" />
                          </div>
                          <span className="text-[11px] font-bold tracking-tight text-foreground/80">{author.name}</span>
                          {author.role === "admin" && (
                            <span className="text-[8px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Admin</span>
                          )}
                        </div>
                      )}
                      {!isMe && author && (isImage || isVideo) && (
                        <div className="flex items-center gap-2 mb-1 px-2 pt-1">
                          <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-border/50 flex-shrink-0">
                            <AvatarImg avatar={author.avatar} size="text-xs" />
                          </div>
                          <span className="text-[10px] font-bold tracking-tight text-foreground/80">{author.name}</span>
                          {author.role === "admin" && (
                            <span className="text-[8px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Admin</span>
                          )}
                        </div>
                      )}

                      {isVideo ? (
                        <video
                          src={msg.content}
                          controls
                          className="max-w-full rounded-xl"
                          style={{ maxHeight: 280 }}
                          preload="metadata"
                        />
                      ) : isImage ? (
                        <img
                          src={msg.content}
                          alt="Image"
                          className="max-w-full rounded-xl cursor-pointer"
                          style={{ maxHeight: 280 }}
                          onClick={() => setLightbox(msg.content)}
                          loading="lazy"
                        />
                      ) : isAudio ? (
                        <AudioMessage dataUrl={msg.content} isMe={isMe} />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      {!isImage && !isVideo && (
                        <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      )}
                      {(isImage || isVideo) && (
                        <p className={`text-[10px] mt-1 px-2 pb-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview Bar */}
            {imagePreview && !videoPreview && (
              <div className="px-3 pt-2 pb-1 border-t border-border/30 flex items-center gap-3">
                <div className="relative">
                  <img src={imagePreview} alt="Aperçu" className="h-20 rounded-xl object-cover" />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">Image prête à envoyer</span>
              </div>
            )}

            {/* Video Preview Bar */}
            {videoPreview && !imagePreview && (
              <div className="px-3 pt-2 pb-1 border-t border-border/30 flex items-center gap-3">
                <div className="relative">
                  <video src={videoPreview} className="h-20 rounded-xl object-cover" />
                  <button
                    onClick={() => setVideoPreview(null)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">Vidéo prête à envoyer</span>
              </div>
            )}

            {/* Recording Bar - hold-to-record with swipe-to-cancel */}
            {isRecording && (
              <div ref={recordBarRef} className="px-3 py-2 border-t border-red-500/30 bg-red-500/5 flex items-center gap-3 select-none" style={{ touchAction: "none" }}>
                <div className={`flex items-center gap-2 flex-1 transition-all ${swipeCancel ? "opacity-40" : ""}`}>
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-mono text-red-400">{formatRecordingTime(recordingTime)}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  swipeCancel ? "bg-destructive/20 text-destructive" : "bg-card/30 text-muted-foreground"
                }`}>
                  <Trash2 size={14} />
                  <span>Glisser → annuler</span>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="px-2 py-2.5 border-t border-border/30 flex-shrink-0" style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}>
              <div className="flex items-end gap-1.5">
                {/* Attach button (image + video) */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-xl bg-card/30 border border-border/50 flex items-center justify-center flex-shrink-0 hover:bg-card/50 transition-colors"
                  aria-label="Joindre un fichier"
                >
                  <Paperclip size={16} className="text-muted-foreground" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={imagePreview || videoPreview ? "Légende (optionnel)..." : "Écrire un message..."}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-card/30 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors min-h-[36px]"
                />

                {/* Mic / Send button */}
                {newMessage.trim() || imagePreview || videoPreview ? (
                  <button
                    onClick={handleSendMessage}
                    className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                  >
                    <Send size={15} />
                  </button>
                ) : (
                  <button
                    onPointerDown={handleRecordPointerDown}
                    onPointerMove={handleRecordPointerMove}
                    onPointerUp={handleRecordPointerUp}
                    onPointerLeave={handleRecordPointerUp}
                    onPointerCancel={handleRecordPointerUp}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-all select-none ${
                      isRecording
                        ? swipeCancel
                          ? "bg-destructive/20 text-destructive"
                          : "bg-red-500 text-white animate-pulse"
                        : "bg-card/30 border border-border/50 text-muted-foreground hover:bg-card/50"
                    }`}
                    aria-label={isRecording ? "Relâcher pour envoyer" : "Maintenir pour enregistrer"}
                    style={{ touchAction: "none" }}
                  >
                    {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MessagesTab.displayName = "MessagesTab";

/* ── Inline Audio Player ── */
const AudioMessage = memo(function AudioMessage({ dataUrl, isMe }: { dataUrl: string; isMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => { if (a.duration) setProgress(a.currentTime / a.duration); };
    const onEnd = () => { setPlaying(false); setProgress(0); };
    const onMeta = () => setDuration(a.duration || 0);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("loadedmetadata", onMeta);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("ended", onEnd); a.removeEventListener("loadedmetadata", onMeta); };
  }, [dataUrl]);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); } else { a.play(); setPlaying(true); }
  }, [playing]);

  const fmt = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }, []);

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
      <audio ref={audioRef} src={dataUrl} preload="metadata" />
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isMe ? "bg-white/20" : "bg-primary/15"
        }`}
      >
        {playing ? <Pause size={14} className={isMe ? "text-white" : "text-primary"} /> : <Play size={14} className={`ml-0.5 ${isMe ? "text-white" : "text-primary"}`} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`h-1.5 rounded-full overflow-hidden ${isMe ? "bg-white/20" : "bg-primary/10"}`}>
          <div
            className={`h-full rounded-full transition-all duration-100 ${isMe ? "bg-white/70" : "bg-primary/60"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className={`text-[9px] ${isMe ? "text-white/50" : "text-muted-foreground"}`}>
            {playing ? fmt(audioRef.current?.currentTime || 0) : duration ? fmt(duration) : "0:00"}
          </span>
        </div>
      </div>
    </div>
  );
});
