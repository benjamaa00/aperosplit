import { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft, Send, Users, X, MessageCircle,
  Mic, MicOff, Play, Pause, Paperclip, Trash2, X as XIcon,
  MoreHorizontal, ImageIcon, Camera, Video, Check, CheckCheck, Loader2,
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

function formatConversationTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatLastMessagePreview(msg: ConversationMessage | undefined): string {
  if (!msg) return "";
  if (msg.type === "image" || msg.content?.startsWith("data:image")) return "📷 Photo";
  if (msg.type === "video" || msg.content?.startsWith("data:video")) return "🎬 Vidéo";
  if (msg.type === "audio" || msg.content?.startsWith("data:audio")) return "🎵 Message vocal";
  return msg.content || "";
}

function formatMessageDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "long" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
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
  const [videoProcessing, setVideoProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [swipeCancel, setSwipeCancel] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showList, setShowList] = useState(true);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recordStartXRef = useRef(0);
  const swipeCancelRef = useRef(false);
  const recordBarRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (conversationsQuery.isError) {
      console.error("Conversations query error:", conversationsQuery.error);
    }
  }, [conversationsQuery.isError, conversationsQuery.error]);

  useEffect(() => {
    if (messagesQuery.isError) {
      console.error("Messages query error:", messagesQuery.error);
    }
  }, [messagesQuery.isError, messagesQuery.error]);

  const sendMessageMutation = trpc.equilibra.sendMessage.useMutation();
  const createDirectConversationMutation = trpc.equilibra.createDirectConversation.useMutation();
  const markReadMutation = trpc.equilibra.markConversationRead.useMutation();
  const addReactionMutation = trpc.equilibra.addReaction.useMutation();
  const deleteMessageMutation = trpc.equilibra.deleteMessage.useMutation();

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
    } catch (err) {
      toast.error("Erreur lors de l'envoi du message");
    }
  }, [activeConversationId, currentMemberId, sendMessageMutation, conversationsQuery, messagesQuery]);

  const handleSendMessage = useCallback(async () => {
    if (videoProcessing) {
      toast.error("Veuillez attendre que la vidéo soit prête");
      return;
    }
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
    setVideoProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setVideoPreview(reader.result as string);
        setVideoProcessing(false);
      };
      reader.onerror = () => {
        toast.error("Erreur lors du traitement de la vidéo");
        setVideoProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erreur lors du traitement de la vidéo");
      setVideoProcessing(false);
    }
  }, []);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    haptics.heavy();
    try {
      await deleteMessageMutation.mutateAsync({ messageId, memberId: currentMemberId });
      messagesQuery.refetch();
      conversationsQuery.refetch();
      toast.success("Message supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }, [currentMemberId, deleteMessageMutation, messagesQuery, conversationsQuery]);

  const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
    haptics.light();
    try {
      await addReactionMutation.mutateAsync({ messageId, memberId: currentMemberId, emoji });
      messagesQuery.refetch();
      conversationsQuery.refetch();
    } catch {
      toast.error("Erreur lors de l'ajout de la réaction");
    }
  }, [currentMemberId, addReactionMutation, messagesQuery, conversationsQuery]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
        setShowList(false);
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
      setShowList(false);
      return;
    }
    const result = await conversationsQuery.refetch();
    const gConv = (Array.isArray(result.data) ? result.data : []).find((c: Conversation) => c.type === "group");
    if (gConv) {
      setActiveConversationId(gConv.id);
      setShowList(false);
    } else {
      toast.error("Impossible d'ouvrir le chat du groupe");
    }
  }, [conversations, conversationsQuery]);

  const handleBack = useCallback(() => {
    setActiveConversationId(null);
    setShowList(true);
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
    if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }, []);

  const formatRecordingTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const handleMessagePointerDown = useCallback((msgId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setDeleteConfirmId(msgId);
      haptics.medium();
    }, 600);
  }, []);

  const handleMessagePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleMessagePointerLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const conversationList = useMemo(() => {
    const items: Array<{ key: string; type: "group" | "direct"; conversation: Conversation; member?: Member }> = [];
    const groupConv = conversations.find((c: Conversation) => c.type === "group");
    if (groupConv) {
      items.push({ key: "group", type: "group", conversation: groupConv });
    }
    for (const m of otherMembers) {
      const memberConv = conversations.find(
        (c: Conversation) => c.type === "direct" && c.otherMemberId === m.id
      );
      const conv = memberConv || {
        id: "",
        type: "direct" as const,
        otherMemberId: m.id,
        unreadCount: 0,
        lastMessage: undefined,
        lastMessageAt: undefined,
      } as Conversation;
      items.push({ key: m.id, type: "direct", conversation: conv, member: m });
    }
    items.sort((a, b) => {
      const aTime = a.conversation.lastMessageAt ? new Date(a.conversation.lastMessageAt).getTime() : 0;
      const bTime = b.conversation.lastMessageAt ? new Date(b.conversation.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
    return items;
  }, [conversations, otherMembers]);

  const isDesktop = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768;
  }, []);

  const showChat = activeConversationId && (!showList || isDesktop);

  // ─── RENDER ───
  return (
    <div className="max-w-md mx-auto w-full h-full flex relative overflow-hidden">
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

      {/* ── Delete Confirm ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Supprimer ce message ?</h3>
            <p className="text-sm text-muted-foreground mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 rounded-2xl bg-card/50 border border-border text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={() => { const id = deleteConfirmId; setDeleteConfirmId(null); handleDeleteMessage(id); }}
                className="flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground text-sm font-semibold"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Conversation List Panel ── */}
      <aside
        className={`
          ${isDesktop ? "w-72 flex-shrink-0" : showChat ? "hidden" : "w-full"}
          border-r border-border/20 bg-card/5 flex flex-col h-full overflow-hidden
        `}
      >
        {/* List Header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-border/10">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>

        {/* Scrollable conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {conversationsQuery.isError && (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-3">
              <MessageCircle size={40} className="text-muted-foreground/20 mb-1" />
              <p className="text-sm text-muted-foreground/80 font-medium">Erreur de connexion au serveur</p>
              <p className="text-xs text-muted-foreground/50">Les messages nécessitent une connexion au serveur.</p>
              <button
                onClick={() => conversationsQuery.refetch()}
                className="px-4 py-2 rounded-xl bg-primary/15 text-primary text-xs font-semibold active:scale-95 transition-transform"
              >
                Réessayer
              </button>
            </div>
          )}

          {!conversationsQuery.isError && conversationList.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <MessageCircle size={40} className="text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground/60">Aucune conversation</p>
            </div>
          )}

          {conversationList.map((item) => {
            const isGroup = item.type === "group";
            const conv = item.conversation;
            const member = item.member;
            const isActive = activeConversationId === conv.id && conv.id !== "";
            const displayName = isGroup ? "Chat du groupe" : (member?.name || "Inconnu");
            const lastMsg = conv.lastMessage as ConversationMessage | undefined;
            const preview = formatLastMessagePreview(lastMsg);
            const time = conv.lastMessageAt ? formatConversationTime(conv.lastMessageAt) : "";

            return (
              <button
                key={item.key}
                onClick={() => {
                  if (isGroup) handleSelectGroupChat();
                  else if (member) handleStartDirectConversation(member.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all active:scale-[0.98] ${
                  isActive
                    ? "bg-primary/10"
                    : "hover:bg-card/60"
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-border/20 flex-shrink-0">
                  {isGroup ? (
                    <div className="w-full h-full bg-primary/15 flex items-center justify-center">
                      <Users size={18} className="text-primary" />
                    </div>
                  ) : (
                    <AvatarImg avatar={member?.avatar || ""} size="text-xl" />
                  )}
                </div>
             <div className="flex-1 min-w-0 text-left">
                   <div className="flex items-center justify-between gap-2">
                     <span className={`text-sm truncate ${
                       (conv.unreadCount || 0) > 0 ? "font-bold" : "font-semibold"
                     }`}>{displayName}</span>
                     {time && (
                       <span className={`text-[10px] flex-shrink-0 ${
                         (conv.unreadCount || 0) > 0
                           ? "text-foreground/90 font-medium"
                           : "text-muted-foreground/60"
                       }`}>{time}</span>
                     )}
                   </div>
                   <div className="flex items-center justify-between gap-2 mt-0.5">
                     <span className={`text-xs truncate ${
                       (conv.unreadCount || 0) > 0
                         ? "text-foreground/60 font-medium"
                         : preview ? "text-muted-foreground/70" : "text-muted-foreground/40"
                     }`}>
                       {preview || "Aucun message"}
                     </span>
                     {(conv.unreadCount || 0) > 0 && (
                       <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                         {conv.unreadCount}
                       </span>
                     )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Chat Shell ── */}
      <section className={`flex-1 flex flex-col min-w-0 ${showChat ? "flex" : "hidden md:flex"}`}>
        {!activeConversationId ? (
          <div className="hidden md:flex flex-col items-center justify-center h-full px-8 text-center">
            <MessageCircle size={48} className="text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground max-w-[260px]">
              Sélectionnez une conversation pour commencer à discuter
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* ── Chat Header ── */}
            <header className="flex-shrink-0 flex items-center gap-2 px-5 pt-4 pb-3 border-b border-border/20"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", backdropFilter: "blur(18px) saturate(150%)", WebkitBackdropFilter: "blur(18px) saturate(150%)" }}
            >
              <button
                onClick={handleBack}
                className="md:hidden w-10 h-10 rounded-2xl bg-card/30 border border-border/40 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                aria-label="Retour"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-3 flex-1 min-w-0 ml-1">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-border/30 flex-shrink-0">
                  {activeConversation?.type === "group" ? (
                    <div className="w-full h-full bg-primary/15 flex items-center justify-center">
                      <Users size={15} className="text-primary" />
                    </div>
                  ) : (
                    <AvatarImg
                      avatar={getMemberById(activeConversation?.otherMemberId || "")?.avatar || ""}
                      size="text-base"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm truncate">
                    {activeConversation?.type === "group"
                      ? "Chat du groupe"
                      : getMemberById(activeConversation?.otherMemberId || "")?.name || "Conversation"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {activeConversation?.type === "group"
                      ? `${members.length} membre${members.length > 1 ? "s" : ""}`
                      : "Conversation privée"}
                  </p>
                </div>
              </div>
              <button className="w-10 h-10 rounded-2xl bg-card/30 border border-border/40 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform" aria-label="Options">
                <MoreHorizontal size={18} className="text-muted-foreground" />
              </button>
            </header>

            {/* ── Message Viewport ── */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto overscroll-behavior-y-contain scroll-smooth"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="w-full flex flex-col justify-end px-4 py-4">
                <div className="flex flex-col gap-1.5" style={{ maxWidth: "100%", marginInline: "auto" }}>
                  {messagesQuery.isError && (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-6">
                      <p className="text-sm text-muted-foreground/80 font-medium">Erreur de connexion au serveur</p>
                      <p className="text-xs text-muted-foreground/50">Impossible de charger les messages.</p>
                      <button
                        onClick={() => messagesQuery.refetch()}
                        className="px-4 py-2 rounded-xl bg-primary/15 text-primary text-xs font-semibold active:scale-95 transition-transform"
                      >
                        Réessayer
                      </button>
                    </div>
                  )}

                  {!messagesQuery.isError && messages.length === 0 && (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-sm text-muted-foreground/60">Aucun message. Envoyez le premier !</p>
                    </div>
                  )}
                  {messages.map((msg: ConversationMessage, idx: number) => {
                    const isMe = msg.memberId === currentMemberId;
                    const author = getMemberById(msg.memberId);
                    const isImage = msg.type === "image" || msg.content?.startsWith("data:image");
                    const isAudio = msg.type === "audio" || msg.content?.startsWith("data:audio");
                    const isVideo = msg.type === "video" || msg.content?.startsWith("data:video");
                    const showDateDivider = idx === 0 || formatMessageDate(messages[idx - 1]?.createdAt || "") !== formatMessageDate(msg.createdAt);
                    const dateLabel = showDateDivider ? formatMessageDate(msg.createdAt) : "";
                    const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
                    const REACTION_EMOJIS = ["❤️","👍","😂","😮","😢","👎","🎉","🔥","🤗","💯"];
                    return (
                      <div key={msg.id}>
                        {showDateDivider && (
                          <div className="flex justify-center my-3">
                            <span className="text-[10px] font-medium text-muted-foreground/60 px-3 py-1 rounded-full bg-muted/20">
                              {dateLabel}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${isMe ? "justify-end" : "justify-start"} select-none group relative`}
                          onPointerDown={() => isMe && handleMessagePointerDown(msg.id)}
                        onPointerUp={handleMessagePointerUp}
                        onPointerLeave={handleMessagePointerLeave}
                        onPointerCancel={handleMessagePointerUp}
                        onContextMenu={(e) => { if (isMe) { e.preventDefault(); setDeleteConfirmId(msg.id); } }}
                      >
                        <div
                          className={`
                            ${isImage || isVideo ? "p-1 overflow-hidden" : "px-4 py-2.5"}
                            ${isMe
                              ? "bg-primary text-primary-foreground rounded-[22px] rounded-br-[6px]"
                              : "bg-card/70 border border-border/40 rounded-[22px] rounded-bl-[6px]"
                            }
                          `}
                          style={{
                            maxWidth: "min(72%, 520px)",
                            ...(isImage || isVideo ? { maxWidth: "min(68%, 380px)" } : {}),
                          }}
                        >
                          {!isMe && author && (
                            <div className={`flex items-center gap-2 mb-1.5 ${isImage || isVideo ? "px-2 pt-1" : "-ml-1"}`}>
                              <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-border/30 flex-shrink-0">
                                <AvatarImg avatar={author.avatar} size="text-xs" />
                              </div>
                              <span className="text-[11px] font-bold tracking-tight text-foreground/70">{author.name}</span>
                              {author.role === "admin" && (
                                <span className="text-[8px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Admin</span>
                              )}
                            </div>
                          )}

                          {isVideo ? (
                            <video
                              src={msg.content}
                              controls
                              className="w-full rounded-[16px]"
                              style={{ maxHeight: 400, aspectRatio: "16/9" }}
                              preload="metadata"
                            />
                          ) : isImage ? (
                            <img
                              src={msg.content}
                              alt="Image"
                              className="w-full rounded-[16px] cursor-pointer object-cover"
                              style={{ maxHeight: 400, aspectRatio: "auto" }}
                              onClick={() => setLightbox(msg.content)}
                              loading="lazy"
                            />
                          ) : isAudio ? (
                            <AudioMessage dataUrl={msg.content} isMe={isMe} />
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                          )}

                          <div className={`flex items-center justify-end gap-1 ${isImage || isVideo ? "px-1 pt-1 pb-0.5" : "mt-1"}`}>
                            <span className={`text-[10px] ${isMe ? "text-primary-foreground/55" : "text-muted-foreground"}`}>
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>

                          {hasReactions && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${isImage || isVideo ? "px-1 pb-1" : "px-1 pb-1"}`}>
                              {Object.entries(msg.reactions!).map(([emoji, memberIds]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(msg.id, emoji)}
                                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all active:scale-110 ${
                                    isMe
                                      ? "bg-white/15 hover:bg-white/25"
                                      : "bg-muted/30 hover:bg-muted/50"
                                  }`}
                                >
                                  <span className="text-xs">{emoji}</span>
                                  <span className={`text-[9px] font-medium ${
                                    isMe ? "text-white/70" : "text-muted-foreground/70"
                                  }`}>
                                    {memberIds.length}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {isMe && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id);
                            }}
                            className="react-affordance absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-card/30 border border-border/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                            aria-label="Réagir"
                          >
                            <span className="text-xs">➕</span>
                          </button>
                        )}
                      </div>

                      {reactionPickerMsgId === msg.id && (
                        <div
                          className="fixed z-[100] flex gap-1 p-1.5 rounded-2xl bg-card border border-border shadow-xl"
                          style={{
                            top: "auto",
                            bottom: "120px",
                            left: isMe ? "auto" : "60px",
                            right: isMe ? "60px" : "auto",
                          }}
                        >
                          {REACTION_EMOJIS.map((e) => (
                            <button
                              key={e}
                              onClick={() => {
                                handleAddReaction(msg.id, e);
                                setReactionPickerMsgId(null);
                              }}
                              className="text-xl hover:bg-muted/30 rounded-xl active:scale-125 transition-transform w-8 h-8 flex items-center justify-center"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* ── Media Preview Bars ── */}
            {imagePreview && !videoPreview && !isRecording && (
              <div className="flex-shrink-0 border-t border-border/20 bg-card/20" style={{ backdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-3 px-4 py-2" style={{ maxWidth: "100%", marginInline: "auto" }}>
                  <div className="relative">
                    <img src={imagePreview} alt="Aperçu" className="h-16 w-16 rounded-xl object-cover" />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                    >
                      <XIcon size={10} />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">Image prête à envoyer</span>
                </div>
              </div>
            )}

            {videoProcessing && !videoPreview && !isRecording && !imagePreview && (
              <div className="flex-shrink-0 border-t border-border/20 bg-card/20" style={{ backdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-3 px-4 py-2" style={{ maxWidth: "100%", marginInline: "auto" }}>
                  <div className="w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center">
                    <Loader2 size={20} className="text-muted-foreground animate-spin" />
                  </div>
                  <span className="text-xs text-muted-foreground">Traitement de la vidéo...</span>
                </div>
              </div>
            )}

            {videoPreview && !imagePreview && !isRecording && (
              <div className="flex-shrink-0 border-t border-border/20 bg-card/20" style={{ backdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-3 px-4 py-2" style={{ maxWidth: "100%", marginInline: "auto" }}>
                  <div className="relative">
                    <video src={videoPreview} className="h-16 w-16 rounded-xl object-cover" />
                    <button
                      onClick={() => setVideoPreview(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                    >
                      <XIcon size={10} />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">Vidéo prête à envoyer</span>
                </div>
              </div>
            )}

            {/* ── Recording UI ── */}
            {isRecording && (
              <div className="flex-shrink-0 border-t border-red-500/25 bg-red-500/5" style={{ backdropFilter: "blur(10px)" }}>
                 <div
                   ref={recordBarRef}
                   className="flex items-center gap-3 px-4 py-3 select-none"
                   style={{ maxWidth: "100%", marginInline: "auto", touchAction: "none" }}
                 >
                  <button
                    onClick={cancelRecording}
                    className="w-10 h-10 rounded-full bg-card/40 border border-border/40 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                    aria-label="Annuler"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse ${swipeCancel ? "opacity-30" : ""}`} />
                    <span className="text-sm font-mono text-red-400 tabular-nums">{formatRecordingTime(recordingTime)}</span>
                    <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      swipeCancel ? "bg-destructive/15 text-destructive" : "bg-card/30 text-muted-foreground"
                    }`}>
                      <Trash2 size={13} />
                      <span>Glisser → annuler</span>
                    </div>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform shadow-lg shadow-red-500/30"
                    aria-label="Envoyer l'audio"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Composer ── */}
            {!isRecording && (
              <div className="flex-shrink-0 border-t border-border/20" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))", backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" }}>
                <div className="px-3 py-3" style={{ maxWidth: "100%", marginInline: "auto" }}>
                  <div className="flex items-end gap-2">
                  <div className="flex items-end gap-1">
                    <button
                      onClick={() => { setShowEmojiPicker(!showEmojiPicker); haptics.light(); }}
                      className="w-[36px] h-[36px] rounded-full bg-card/30 border border-border/40 flex items-center justify-center flex-shrink-0 hover:bg-card/50 active:scale-90 transition-all"
                      aria-label="Emoji"
                    >
                      <span className="text-lg">😊</span>
                    </button>
                    <button
                      onClick={() => setShowAttachmentSheet(true)}
                      className="w-[36px] h-[36px] rounded-full bg-card/30 border border-border/40 flex items-center justify-center flex-shrink-0 hover:bg-card/50 active:scale-90 transition-all"
                      aria-label="Ajouter un média"
                    >
                      <Paperclip size={15} className="text-muted-foreground" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                  </div>

                    <div className="flex-1 min-w-0 relative">
                      <textarea
                        ref={inputRef as any}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={imagePreview || videoPreview ? "Ajouter une légende..." : "Message"}
                        rows={1}
                        className="w-full px-4 py-2.5 rounded-2xl bg-card/30 border border-border/40 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors resize-none overflow-hidden"
                        style={{ minHeight: 44, maxHeight: 120 }}
                        aria-label="Saisir un message"
                      />
                    </div>

                    {newMessage.trim() || imagePreview || videoPreview ? (
                      <button
                        onClick={handleSendMessage}
                        className="w-[44px] h-[44px] rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform shadow-sm shadow-primary/20"
                        aria-label="Envoyer"
                      >
                        <Send size={16} />
                      </button>
                    ) : (
                      <button
                        onPointerDown={handleRecordPointerDown}
                        onPointerMove={handleRecordPointerMove}
                        onPointerUp={handleRecordPointerUp}
                        onPointerLeave={handleRecordPointerUp}
                        onPointerCancel={handleRecordPointerUp}
                        className={`w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all select-none ${
                          isRecording
                            ? swipeCancel
                              ? "bg-destructive/15 text-destructive"
                              : "bg-red-500 text-white animate-pulse shadow-sm shadow-red-500/30"
                            : "bg-card/30 border border-border/40 text-muted-foreground hover:bg-card/50"
                        }`}
                        aria-label="Enregistrer un message vocal"
                        aria-pressed={isRecording}
                        style={{ touchAction: "none" }}
                      >
                        {isRecording ? <MicOff size={17} /> : <Mic size={17} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
             </section>

      {/* ── Emoji Picker ── */}
      {showEmojiPicker && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 bg-card border-t border-border/50"
          style={{
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 8px))",
            maxHeight: "40vh",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div className="px-3 pt-2 pb-1 flex items-center justify-between">
            <div className="w-10 h-1 rounded-full bg-muted/30 mx-auto mb-1" />
            <div className="flex-1 flex justify-center">
              <span className="text-xs text-muted-foreground">Emoji</span>
            </div>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center"
            >
              <XIcon size={12} />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1 px-3 overflow-y-auto" style={{ maxHeight: "calc(40vh - 50px)" }}>
            {["😀","😂","🥰","😍","🤔","😅","😎","🤗","😊","🙂","😘","👍","❤️","🔥","🎉","🤝","💯","🙏","👏","🎁","🍕","🍔","🍰","☕","🍷","🍺","📚","✈️","🚗","🏠","💰","⏰","✅","❌","⚠️","❓","❗","💡","⭐","🌟"].map((e) => (
              <button
                key={e}
                onClick={() => {
                  const textarea = inputRef.current;
                  if (textarea && 'value' in textarea) {
                    const ta = textarea as any;
                    const start = ta.selectionStart || 0;
                    const end = ta.selectionEnd || 0;
                    setNewMessage(newMessage.slice(0, start) + e + newMessage.slice(end));
                  } else {
                    setNewMessage(newMessage + e);
                  }
                  setShowEmojiPicker(false);
                  haptics.light();
                }}
                className="text-2xl hover:bg-muted/30 rounded-xl active:scale-110 transition-transform flex items-center justify-center"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Attachment Sheet ── */}
      {showAttachmentSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowAttachmentSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-sm bg-card border border-border/50 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 10px))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Ajouter un média</h3>
              <button onClick={() => setShowAttachmentSheet(false)} className="w-8 h-8 rounded-xl bg-muted/30 flex items-center justify-center">
                <XIcon size={15} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <button
                onClick={() => { setShowAttachmentSheet(false); fileInputRef.current?.click(); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/50 border border-border/30 hover:bg-card/80 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <ImageIcon size={22} className="text-blue-400" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Photo</span>
              </button>
              <button
                onClick={() => { setShowAttachmentSheet(false); videoFileInputRef.current?.click(); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/50 border border-border/30 hover:bg-card/80 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Video size={22} className="text-purple-400" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Vidéo</span>
              </button>
              <button
                onClick={() => { setShowAttachmentSheet(false); fileInputRef.current?.click(); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/50 border border-border/30 hover:bg-card/80 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                  <Camera size={22} className="text-green-400" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Caméra</span>
              </button>
              <button
                onClick={() => { setShowAttachmentSheet(false); fileInputRef.current?.click(); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/50 border border-border/30 hover:bg-card/80 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <Paperclip size={22} className="text-orange-400" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">Fichier</span>
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="flex items-center gap-2.5 px-1 py-1 min-w-[180px] max-w-[200px]" onClick={(e) => e.stopPropagation()}>
      <audio ref={audioRef} src={dataUrl} preload="metadata" />
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ${
          isMe ? "bg-white/20 hover:bg-white/30" : "bg-primary/15 hover:bg-primary/25"
        }`}
      >
        {playing ? <Pause size={14} className={isMe ? "text-white" : "text-primary"} /> : <Play size={14} className={`ml-0.5 ${isMe ? "text-white" : "text-primary"}`} />}
      </button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={(e) => {
        e.stopPropagation();
        const a = audioRef.current;
        if (!a || !a.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        a.currentTime = pct * a.duration;
      }}>
        <div className={`h-1.5 rounded-full overflow-hidden ${isMe ? "bg-white/20" : "bg-primary/10"} transition-colors`}>
          <div
            className={`h-full rounded-full transition-all duration-100 ${isMe ? "bg-white/70" : "bg-primary/60"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className={`text-[9px] ${isMe ? "text-white/50" : "text-muted-foreground"}`}>
            {playing ? fmt(audioRef.current?.currentTime || 0) : duration ? fmt(duration) : "0:00"}
          </span>
          {duration > 0 && (
            <span className={`text-[9px] ${isMe ? "text-white/50" : "text-muted-foreground"}`}>
              {fmt(duration)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
