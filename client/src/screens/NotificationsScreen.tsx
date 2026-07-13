import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Notification } from "../types";

export function NotificationsScreen({ notifications, currentMemberId, onBack, onMarkRead, onMarkAllRead }: {
  notifications: Notification[];
  currentMemberId: string;
  onBack: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const unread = notifications.filter(n => !n.read).length;
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = filter === "unread" ? notifications.filter(n => !n.read) : notifications;

  const getIcon = (type: string) => {
    switch (type) {
      case "payment_request": return "💸";
      case "payment_accepted": return "✅";
      case "payment_refused": return "❌";
      case "payment_reminder": return "⏰";
      case "expense_added": return "🧾";
      case "member_joined": return "👥";
      case "member_expelled": return "🚪";
      default: return "🔔";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto px-5 pt-12 space-y-5">
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center">
          <ChevronRight size={20} className="rotate-180" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread} non lues</p>
        </div>
        {unread > 0 && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={onMarkAllRead}
            className="text-xs text-primary font-semibold px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20">
            Tout lire
          </motion.button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 bg-card/30 border border-border rounded-2xl p-1">
        {(["all", "unread"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${filter === f ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground"}`}>
            {f === "all" ? "Toutes" : "Non lues"}
            {f === "unread" && unread > 0 && <span className="ml-1.5 text-[10px]">({unread})</span>}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 mx-auto mb-5 rounded-full bg-muted/30 flex items-center justify-center">
            <span className="text-5xl">🔔</span>
          </motion.div>
          <p className="text-muted-foreground text-sm">
            {filter === "unread" ? "Tout est lu !" : "Aucune notification"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif, i) => (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => !notif.read && onMarkRead(notif.id)}
              className={`glass-card-enhanced rounded-2xl p-4 flex items-start gap-3 transition-all cursor-pointer ${!notif.read ? "border-primary/20 bg-primary/5" : ""}`}>
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-xl shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold truncate ${notif.read ? "text-muted-foreground" : ""}`}>
                    {notif.title}
                  </p>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                  {new Date(notif.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
