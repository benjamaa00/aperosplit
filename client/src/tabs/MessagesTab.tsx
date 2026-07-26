import { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Send, Users, Search, X, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AvatarImg } from "../components/AvatarImg";
import { EmptyState } from "../components/EmptyState";
import { haptics } from "../utils/haptics";
import type { Member, Conversation, ConversationMessage } from "../types";

export const MessagesTab = memo(function MessagesTab({
  currentMemberId,
  members,
  currency,
}: {
  currentMemberId: string;
  members: Member[];
  currency: string;
}) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // tRPC queries
  const conversationsQuery = trpc.equilibra.getConversations.useQuery(
    { memberId: currentMemberId },
    { enabled: !!currentMemberId, refetchInterval: 5000, staleTime: 3000 }
  );

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (activeConversationId && currentMemberId) {
      markReadMutation.mutate({ conversationId: activeConversationId, memberId: currentMemberId });
    }
  }, [activeConversationId, currentMemberId]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeConversationId) return;
    const content = newMessage.trim();
    setNewMessage("");
    haptics.light();
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversationId,
        memberId: currentMemberId,
        content,
      });
      conversationsQuery.refetch();
      messagesQuery.refetch();
    } catch {
      setNewMessage(content);
    }
  }, [newMessage, activeConversationId, currentMemberId, sendMessageMutation, conversationsQuery, messagesQuery]);

  const handleStartDirectConversation = useCallback(async (targetMemberId: string) => {
    if (targetMemberId === currentMemberId) return;
    haptics.light();
    try {
      const result = await createDirectConversationMutation.mutateAsync({
        memberId: currentMemberId,
        targetMemberId,
      });
      if (result.conversationId) {
        setActiveConversationId(result.conversationId);
        conversationsQuery.refetch();
      }
    } catch {}
  }, [currentMemberId, createDirectConversationMutation, conversationsQuery]);

  const handleSelectGroupChat = useCallback(async () => {
    haptics.light();
    // Find the group conversation (auto-created by getConversations query)
    const groupConv = conversations.find((c: Conversation) => c.type === "group");
    if (groupConv) {
      setActiveConversationId(groupConv.id);
    } else {
      // Force refetch to ensure group conversation is created
      await conversationsQuery.refetch();
      const updated = conversationsQuery.data;
      const gConv = updated?.find((c: Conversation) => c.type === "group");
      if (gConv) setActiveConversationId(gConv.id);
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

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return otherMembers;
    const q = searchQuery.toLowerCase();
    return otherMembers.filter((m) => m.name.toLowerCase().includes(q));
  }, [otherMembers, searchQuery]);

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

  // ─── RENDER ───
  return (
    <div className="flex h-[calc(100dvh-110px)]">
      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConversationId ? (
          /* ── Conversation List / New Chat ── */
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 pt-12 pb-3">
              <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {conversations.length > 0
                  ? `${conversations.length} conversation${conversations.length > 1 ? "s" : ""}`
                  : "Commencez une conversation"}
              </p>
            </div>

            {/* Conversations */}
            {conversations.length > 0 && (
              <div className="px-3 space-y-1">
                {conversations.map((conv: Conversation) => {
                  const isGroup = conv.type === "group";
                  const otherMember = !isGroup && conv.otherMemberId
                    ? getMemberById(conv.otherMemberId)
                    : null;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        haptics.light();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card/30 border border-border/50 hover:bg-card/50 transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {isGroup ? (
                          <Users size={20} className="text-primary" />
                        ) : (
                          <AvatarImg
                            avatar={otherMember?.avatar || "👤"}
                            size="text-xl"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm truncate">
                            {isGroup ? "Groupe" : otherMember?.name || "Conversation"}
                          </span>
                          {conv.lastMessageAt && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatTime(conv.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {conv.lastMessage || "Aucun message"}
                          </p>
                          {(conv.unreadCount || 0) > 0 && (
                            <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* New Chat Section */}
            <div className="px-4 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Nouvelle conversation
              </p>
              {/* Group Chat Button */}
              <button
                onClick={handleSelectGroupChat}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all mb-3"
              >
                <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center">
                  <Users size={18} className="text-primary" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-sm block">Chat du groupe</span>
                  <span className="text-xs text-muted-foreground">
                    Parlez avec tout le groupe
                  </span>
                </div>
              </button>

              {/* Search members */}
              <div className="relative mb-3">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card/30 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X size={14} className="text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Member list for new DMs */}
              <div className="space-y-1">
                {filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleStartDirectConversation(member.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-card/30 transition-all text-left"
                  >
                    <AvatarImg avatar={member.avatar} size="text-xl" />
                    <div>
                      <span className="font-medium text-sm">{member.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize">
                        {member.role || "membre"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {conversations.length === 0 && (
              <div className="flex-1 flex items-center justify-center px-6">
                <EmptyState
                  icon={MessageCircle}
                  title="Aucune conversation"
                  description="Sélectionnez un membre ou le groupe pour commencer à discuter"
                />
              </div>
            )}
          </div>
        ) : (
          /* ── Chat View ── */
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-3 pt-12 pb-3 border-b border-border/30">
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
                    : "Conversation privée"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {members.length} membre{members.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    Aucun message. Envoyez le premier !
                  </p>
                </div>
              )}
              {messages.map((msg: ConversationMessage) => {
                const isMe = msg.memberId === currentMemberId;
                const author = getMemberById(msg.memberId);
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                          : "bg-card/60 border border-border/50 rounded-2xl rounded-bl-md"
                      } px-4 py-2.5`}
                    >
                      {!isMe && author && (
                        <div className="flex items-center gap-2 mb-1">
                          <AvatarImg avatar={author.avatar} size="text-xs" />
                          <span className="text-[10px] font-semibold opacity-70">
                            {author.name}
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-3 py-3 border-t border-border/30">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Écrire un message..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-card/30 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Vertical Profile Rail (Right Side) ── */}
      <div className="w-16 border-l border-border/30 flex flex-col items-center py-12 gap-2 overflow-y-auto scrollbar-hidden bg-card/10">
        {/* Group avatar */}
        <button
          onClick={handleSelectGroupChat}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            activeConversation?.type === "group"
              ? "bg-primary/20 ring-2 ring-primary"
              : "bg-primary/10 hover:bg-primary/20"
          }`}
        >
          <Users size={16} className="text-primary" />
          {(conversations.find((c: Conversation) => c.type === "group")?.unreadCount || 0) >
            0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
              {conversations.find((c: Conversation) => c.type === "group")?.unreadCount}
            </span>
          )}
        </button>

        <div className="w-8 h-px bg-border/50 my-1" />

        {/* Individual member avatars */}
        {otherMembers.map((member) => {
          const memberConv = conversations.find(
            (c: Conversation) =>
              c.type === "direct" && c.otherMemberId === member.id
          );
          const isActive =
            activeConversationId &&
            memberConv &&
            activeConversationId === memberConv.id;

          return (
            <button
              key={member.id}
              onClick={() => handleStartDirectConversation(member.id)}
              className={`relative w-11 h-11 rounded-full overflow-hidden transition-all ${
                isActive
                  ? "ring-2 ring-primary"
                  : "hover:ring-1 hover:ring-border"
              }`}
            >
              <AvatarImg avatar={member.avatar} size="text-lg" />
              {(memberConv?.unreadCount || 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                  {memberConv?.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
