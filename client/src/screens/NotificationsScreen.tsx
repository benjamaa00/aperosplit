import { useState, useCallback } from "react";
import { ArrowLeft, Bell, Check, CheckCheck, X, Receipt, CreditCard, Users, MessageCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import type { Notification } from "../types";

interface NotificationsScreenProps {
  notifications: Notification[];
  currentMemberId: string;
  onBack: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationsScreen({ notifications, currentMemberId, onBack, onMarkRead, onMarkAllRead }: NotificationsScreenProps) {
  const unread = notifications.filter(n => !n.read).length;
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const filtered = filter === "unread" ? notifications.filter(n => !n.read) : notifications;

  const getIcon = (type: string) => {
    switch (type) {
      case "payment_request": return <CreditCard size={18} className="text-orange-400" />;
      case "payment_accepted": return <Check size={18} className="text-green-400" />;
      case "payment_refused": return <X size={18} className="text-red-400" />;
      case "payment_reminder": return <Clock size={18} className="text-yellow-400" />;
      case "payment_marked_paid": return <CreditCard size={18} className="text-blue-400" />;
      case "receipt_confirmed": return <CheckCheck size={18} className="text-green-400" />;
      case "payment_disputed": return <AlertTriangle size={18} className="text-red-400" />;
      case "payment_comment": return <MessageCircle size={18} className="text-purple-400" />;
      case "expense_added": return <Receipt size={18} className="text-blue-400" />;
      case "member_joined": return <Users size={18} className="text-teal-400" />;
      case "member_expelled": return <Users size={18} className="text-red-400" />;
      default: return <Bell size={18} className="text-muted-foreground" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "payment_request": return "bg-orange-500/15";
      case "payment_accepted": return "bg-green-500/15";
      case "payment_refused": return "bg-red-500/15";
      case "payment_reminder": return "bg-yellow-500/15";
      case "payment_marked_paid": return "bg-blue-500/15";
      case "receipt_confirmed": return "bg-green-500/15";
      case "payment_disputed": return "bg-red-500/15";
      case "payment_comment": return "bg-purple-500/15";
      case "expense_added": return "bg-blue-500/15";
      case "member_joined": return "bg-teal-500/15";
      case "member_expelled": return "bg-red-500/15";
      default: return "bg-muted/30";
    }
  };

  const getDetailLabel = (type: string) => {
    switch (type) {
      case "payment_request": return "Demande de paiement";
      case "payment_accepted": return "Paiement accepté";
      case "payment_refused": return "Paiement refusé";
      case "payment_reminder": return "Rappel de paiement";
      case "payment_marked_paid": return "Paiement marqué payé";
      case "receipt_confirmed": return "Réception confirmée";
      case "payment_disputed": return "Litige de paiement";
      case "payment_comment": return "Commentaire";
      case "expense_added": return "Nouvelle dépense";
      case "member_joined": return "Nouveau membre";
      case "member_expelled": return "Membre expulsé";
      default: return "Notification";
    }
  };

  const handleNotifClick = useCallback((notif: Notification) => {
    setSelectedNotif(notif);
    if (!notif.read) onMarkRead(notif.id);
  }, [onMarkRead]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin}min`;
    if (diffH < 24) return `Il y a ${diffH}h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-md mx-auto px-5 pt-12 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread} non lue{unread !== 1 ? "s" : ""}</p>
        </div>
        {unread > 0 && (
          <button onClick={() => { onMarkAllRead(); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <CheckCheck size={14} />
            Tout lire
          </button>
        )}
      </div>

      <div className="flex gap-2 bg-card/30 border border-border rounded-2xl p-1">
        {(["all", "unread"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${filter === f ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground"}`}>
            {f === "all" ? "Toutes" : "Non lues"}
            {f === "unread" && unread > 0 && <span className="ml-1.5 text-[10px]">({unread})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          description="Vous êtes à jour ! Les notifications de paiement et d'activité apparaîtront ici."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => (
            <button key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`w-full text-left glass-card-enhanced rounded-2xl p-4 flex items-start gap-3 transition-all duration-200 cursor-pointer active:scale-[0.98] ${!notif.read ? "border-primary/20 bg-primary/[0.03]" : "opacity-70 hover:opacity-100"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(notif.type)}`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold truncate ${notif.read ? "text-muted-foreground" : ""}`}>
                    {notif.title}
                  </p>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1.5">{formatTime(notif.createdAt)}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground/30 shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}

      <div className="h-8" />

      {/* Detail Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center" onClick={() => setSelectedNotif(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-card border border-border rounded-t-3xl p-6 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${getIconBg(selectedNotif.type)}`}>
                  {getIcon(selectedNotif.type)}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{getDetailLabel(selectedNotif.type)}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    {new Date(selectedNotif.createdAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedNotif(null)}
                className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <h3 className="text-lg font-bold mb-2">{selectedNotif.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{selectedNotif.message}</p>

            {selectedNotif.data && (
              <div className="mt-4 p-3 rounded-xl bg-muted/20 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Détails</p>
                <div className="space-y-1.5">
                  {selectedNotif.data.amount && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Montant</span>
                      <span className="font-semibold">{Number(selectedNotif.data.amount).toFixed(2)} MAD</span>
                    </div>
                  )}
                  {selectedNotif.data.paymentId && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Paiement</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{selectedNotif.data.paymentId.slice(0, 16)}...</span>
                    </div>
                  )}
                  {selectedNotif.data.payerId && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Payeur</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{selectedNotif.data.payerId.slice(0, 16)}...</span>
                    </div>
                  )}
                  {selectedNotif.data.fromId && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">De</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{selectedNotif.data.fromId.slice(0, 16)}...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button onClick={() => setSelectedNotif(null)}
              className="w-full mt-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
