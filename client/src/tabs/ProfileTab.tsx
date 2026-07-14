import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Fingerprint, Moon, Sun, Sparkles, Copy, Share2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useThemeContext } from "../contexts/ThemeContext";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import type { Member } from "../types";
import { fadeUp, spring } from "../constants";
import { useHaptic } from "../hooks/useHaptic";

export function ProfileTab({
  currentMember,
  members,
  biometricEnabled,
  biometricAvailable,
  onToggleBiometric,
  onLogout,
  onAddMember,
  onRemoveMember,
  isLocked,
  unreadCount,
  onOpenNotifications,
  onOpenReports,
  onOpenGroupSettings,
  onOpenMembers,
}: {
  currentMember: Member;
  members: Member[];
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  onToggleBiometric: () => void;
  onLogout: () => void;
  onAddMember?: (name: string, avatar: string) => void;
  onRemoveMember?: (memberId: string) => void;
  isLocked: boolean;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenReports?: () => void;
  onOpenGroupSettings?: () => void;
  onOpenMembers?: () => void;
}) {
  const { theme, toggleTheme } = useThemeContext();
  const shareUrl = window.location.origin;
  const haptic = useHaptic();
  const [inviteTokenValue, setInviteTokenValue] = useState<string | null>(null);
  const generateInviteMutation = trpc.equilibra.generateInvite.useMutation();

  const handleGenerateInvite = async () => {
    try {
      const result = await generateInviteMutation.mutateAsync({});
      if (result?.token) {
        setInviteTokenValue(result.token);
      }
    } catch {
      toast.error("Erreur lors de la génération du lien d'invitation");
    }
  };

  // Generate invite token on mount
  useEffect(() => {
    if (!inviteTokenValue) {
      handleGenerateInvite();
    }
  }, []);

  const inviteLink = inviteTokenValue ? `${shareUrl}?invite=${inviteTokenValue}` : "";

  const copyLink = async () => {
    haptic("light");
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Lien copié !");
      haptic("success");
    } catch {
      toast.error("Impossible de copier le lien");
      haptic("error");
    }
  };

  const shareLink = async () => {
    haptic("light");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Équilibra Groupe", text: "Rejoignez notre groupe !", url: inviteLink });
      } catch { /* cancelled */ }
    } else {
      copyLink();
    }
  };

  return (
    <motion.div {...fadeUp} className="max-w-md mx-auto px-5 pt-16 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <motion.div 
          className="relative inline-block"
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-sm mb-4">
            <span className="text-6xl">{currentMember.avatar}</span>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-primary/10 blur-xl -z-10"
          />
          {/* Admin Badge */}
          {currentMember.role === "admin" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-background"
            >
              <Sparkles size={14} className="text-white" />
            </motion.div>
          )}
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight">{currentMember.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">Membre du groupe</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${currentMember.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border"}`}>{currentMember.role === "admin" ? "Admin" : "Membre"}</span>
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-lg shadow-primary/5"
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"
            >
              <Fingerprint size={20} className="text-primary" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold">Face ID / Touch ID</p>
              <p className="text-xs text-muted-foreground">
                {biometricAvailable ? "Verrouillage biométrique" : "Non disponible sur cet appareil"}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleBiometric}
            disabled={!biometricAvailable}
            className={`w-[52px] h-8 rounded-full transition-all duration-300 relative ${
              biometricEnabled ? "bg-primary shadow-lg shadow-primary/30" : "bg-secondary"
            } ${!biometricAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <motion.div
              animate={{ x: biometricEnabled ? 22 : 3 }}
              transition={spring}
              className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-lg shadow-primary/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"
            >
              {theme === "dark" ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
            </motion.div>
            <div>
              <p className="text-sm font-semibold">Mode sombre</p>
              <p className="text-xs text-muted-foreground">
                {theme === "dark" ? "Thème sombre activé" : "Thème clair activé"}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              haptic("medium");
              toggleTheme();
            }}
            className={`w-[52px] h-8 rounded-full transition-all duration-300 relative ${
              theme === "dark" ? "bg-primary shadow-lg shadow-primary/30" : "bg-secondary"
            }`}
          >
            <motion.div
              animate={{ x: theme === "dark" ? 22 : 3 }}
              transition={spring}
              className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {onOpenNotifications && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptic("light"); onOpenNotifications(); }}
            className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2 relative"
          >
            <span className="text-2xl">🔔</span>
            <span className="text-xs font-medium">Notifications</span>
            {unreadCount && unreadCount > 0 ? (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            ) : null}
          </motion.button>
        )}
        {onOpenReports && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptic("light"); onOpenReports(); }}
            className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2"
          >
            <span className="text-2xl">📊</span>
            <span className="text-xs font-medium">Rapports</span>
          </motion.button>
        )}
        {onOpenGroupSettings && currentMember.role === "admin" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.19 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptic("light"); onOpenGroupSettings(); }}
            className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2"
          >
            <span className="text-2xl">⚙️</span>
            <span className="text-xs font-medium">Paramètres</span>
          </motion.button>
        )}
        {onOpenMembers && currentMember.role === "admin" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.21 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptic("light"); onOpenMembers(); }}
            className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2"
          >
            <span className="text-2xl">👥</span>
            <span className="text-xs font-medium">Membres</span>
          </motion.button>
        )}
      </div>

      {/* Share Section - Admin Only */}
      {currentMember.role === "admin" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/20 rounded-2xl overflow-hidden shadow-lg shadow-primary/10"
        >
          <div className="p-4 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <p className="text-sm font-bold text-primary">Inviter des amis</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Partagez l'application avec vos amis</p>
          </div>

          {/* QR Code - Always Visible */}
          <div className="p-6 flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-5 shadow-2xl mb-4"
            >
              <QRCodeSVG
                value={inviteLink}
                size={200}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </motion.div>
            
            <p className="text-xs text-center text-muted-foreground mb-4">
              Scannez ce QR code pour rejoindre le groupe
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={copyLink}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl press-scale flex items-center justify-center gap-2"
              >
                <Copy size={16} />
                Copier le lien
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={shareLink}
                className="flex-1 bg-secondary text-secondary-foreground font-semibold py-3 rounded-xl press-scale flex items-center justify-center gap-2"
              >
                <Share2 size={16} />
                Partager
              </motion.button>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="bg-background/50 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground text-center">
                🔒 Seul l'administrateur peut inviter de nouveaux membres
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Members */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-lg shadow-primary/5"
      >
        <div className="p-4 pb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Membres du groupe</p>
            <p className="text-xs text-muted-foreground">{members.length} membres</p>
          </div>
        </div>
        {members.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            whileHover={{ backgroundColor: "hsl(var(--card)/70)" }}
            className="px-4 py-3.5 flex items-center gap-3 border-t border-border cursor-pointer"
          >
            <motion.span 
              className="text-2xl"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.3 }}
            >
              {member.avatar}
            </motion.span>
            <p className="text-sm font-medium flex-1">{member.name}</p>
            {member.id === currentMember.id && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[10px] text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20"
              >
                Vous
              </motion.span>
            )}
            {onRemoveMember && currentMember.role === "admin" && member.id !== currentMember.id && (
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => onRemoveMember(member.id)}
                className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/10"
              >
                <X size={14} />
              </motion.button>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Switch Account - Available for all users except locked */}
      {!isLocked && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            haptic("medium");
            onLogout();
          }}
          className="w-full bg-primary/10 text-primary font-semibold py-3.5 rounded-2xl border border-primary/20 press-scale shadow-lg shadow-primary/5"
        >
          Changer de compte
        </motion.button>
      )}

      {/* Logout - Admin Only and Not Locked */}
      {!isLocked && currentMember.role === "admin" && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            haptic("medium");
            onLogout();
          }}
          className="w-full bg-red-500/10 text-red-400 font-semibold py-3.5 rounded-2xl border border-red-500/10 press-scale shadow-lg shadow-red-500/5"
        >
          Changer d'identité
        </motion.button>
      )}

      {/* Clear All Data - Available for Mohamed */}
      {currentMember.name === "Mohamed" && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            haptic("heavy");
            if (window.confirm("Êtes-vous sûr de vouloir effacer toutes les données ? Cette action est irréversible.")) {
              localStorage.clear();
              sessionStorage.clear();
              toast.success("Toutes les données ont été effacées");
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          }}
          className="w-full bg-red-500/20 text-red-400 font-semibold py-3.5 rounded-2xl border border-red-500/20 press-scale shadow-lg shadow-red-500/10"
        >
          🗑️ Effacer toutes les données
        </motion.button>
      )}

      <div className="h-4" />
    </motion.div>
  );
}
