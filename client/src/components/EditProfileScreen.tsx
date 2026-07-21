import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Shuffle, Check, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { AvatarImg } from "./AvatarImg";
import { fadeUp } from "../constants";
import { resolveAvatar } from "../utils/avatarStorage";

const EMOJI_CATEGORIES = [
  {
    name: "Visages",
    emojis: ["😀", "😂", "🥹", "😍", "🤩", "😎", "🥳", "😏", "🤓", "😇", "🥰", "😴", "🤔", "😤", "😈", "💀"],
  },
  {
    name: "Personnes",
    emojis: ["👤", "👩", "👨", "🧑", "👩‍🦰", "👨‍🦱", "👩‍🦱", "🧑‍🦱", "👨‍🦳", "👩‍🦳", "🧔", "👳‍♀️", "👳", "🧕", "👲", "🧑‍🦲"],
  },
  {
    name: "Métiers",
    emojis: ["👨‍💼", "👩‍💻", "👨‍🎨", "👩‍🔬", "👨‍🍳", "👩‍⚕️", "👨‍🏫", "👩‍🚒", "👨‍🚀", "👩‍⚖️", "🧑‍🏭", "👩‍🎤"],
  },
  {
    name: "Fun",
    emojis: ["🤖", "👽", "🎃", "🦊", "🐱", "🐶", "🦁", "🐸", "🐵", "🦋", "🐙", "🦄", "🐲", "🐺", "🦈", "🦅"],
  },
  {
    name: "Objets",
    emojis: ["🔥", "⭐", "💎", "🎵", "🎮", "🏀", "⚽", "🎯", "🎨", "🚀", "💡", "🏆"],
  },
];

interface EditProfileScreenProps {
  currentName: string;
  currentAvatar: string;
  onSave: (name: string, avatar: string) => void;
  onBack: () => void;
  saving?: boolean;
}

export function EditProfileScreen({ currentName, currentAvatar, onSave, onBack, saving }: EditProfileScreenProps) {
  const [name, setName] = useState(currentName);
  const resolvedCurrent = resolveAvatar(currentAvatar);
  const isPhoto = resolvedCurrent.startsWith("data:");
  const [avatarMode, setAvatarMode] = useState<"emoji" | "photo">(isPhoto ? "photo" : "emoji");
  const [avatar, setAvatar] = useState(isPhoto ? "" : resolvedCurrent);
  const [photoPreview, setPhotoPreview] = useState<string | null>(isPhoto ? resolvedCurrent : null);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isDirty = name.trim() !== currentName || avatar !== (isPhoto ? "" : resolvedCurrent) || photoPreview !== (isPhoto ? resolvedCurrent : null);

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.6);
        setPhotoPreview(compressed);
        setAvatarMode("photo");
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRandomAvatar = useCallback(() => {
    const emojis = ["😀", "😂", "🥹", "😍", "🤩", "😎", "🥳", "🦊", "🐱", "🐶", "🦁", "🐸", "🐵", "🤖", "💎", "🔥", "⭐", "🚀", "🎯", "🎨"];
    const next = emojis.filter(e => e !== avatar);
    const pick = next[Math.floor(Math.random() * next.length)];
    setAvatar(pick);
    setAvatarMode("emoji");
    setPhotoPreview(null);
  }, [avatar]);

  const displayAvatar = avatarMode === "photo" && photoPreview ? photoPreview : avatar;

  const handleSave = () => {
    if (!name.trim()) return;
    const finalAvatar = avatarMode === "photo" && photoPreview ? photoPreview : avatar;
    onSave(name.trim(), finalAvatar);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <motion.button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Modifier le profil</h1>
          <p className="text-sm text-muted-foreground">Photo & nickname</p>
        </div>
      </div>

      <motion.div {...fadeUp} className="flex-1 overflow-y-auto px-5 space-y-6">
        {/* Avatar Preview */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30 shadow-xl shadow-primary/10 overflow-hidden">
              {avatarMode === "photo" && photoPreview ? (
                <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : avatar ? (
                <span className="text-6xl">{avatar}</span>
              ) : (
                <span className="text-6xl">👤</span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-primary/[0.08] blur-xl -z-10" />
          </div>
        </div>

        {/* Photo action buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={handleRandomAvatar}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-card/50 border border-border text-sm font-semibold transition-colors hover:bg-card/80"
          >
            <Shuffle size={16} className="text-primary" />
            Aléatoire
          </motion.button>
          <motion.button
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-card/50 border border-border text-sm font-semibold transition-colors hover:bg-card/80"
          >
            <Camera size={16} className="text-primary" />
            Selfie
          </motion.button>
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-card/50 border border-border text-sm font-semibold transition-colors hover:bg-card/80"
          >
            <ImageIcon size={16} className="text-primary" />
            Photo
          </motion.button>
        </div>

        <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handlePhotoSelect} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />

        {/* Remove photo button */}
        {avatarMode === "photo" && photoPreview && (
          <motion.button
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { setAvatarMode("emoji"); setPhotoPreview(null); setAvatar("👤"); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/30 text-sm font-medium text-muted-foreground"
          >
            <X size={14} />
            Retirer la photo
          </motion.button>
        )}

        {/* Emoji picker */}
        {avatarMode !== "photo" && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ou choisir un emoji</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(i)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedCategory === i
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-card/50 border border-border text-muted-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji) => (
                <motion.button
                  key={emoji}
                  onClick={() => { setAvatar(emoji); setAvatarMode("emoji"); setPhotoPreview(null); }}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all text-xl ${
                    avatar === emoji && avatarMode === "emoji"
                      ? "bg-primary/20 border-2 border-primary shadow-md shadow-primary/20 scale-110"
                      : "bg-card/30 border border-transparent hover:bg-card/60"
                  }`}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Name input */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nickname</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom ou pseudo"
            className="w-full bg-card/50 border border-border rounded-2xl px-5 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all placeholder:text-muted-foreground/40"
          />
          <p className="text-[11px] text-muted-foreground ml-1">
            C'est ainsi que les autres membres vous verront
          </p>
        </div>

        <div className="h-8" />
      </motion.div>

      {/* Save button */}
      <div className="px-5 pb-8 pt-4">
        <motion.button
          onClick={handleSave}
          disabled={!name.trim() || !isDirty || !!saving}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-xl shadow-primary/25 text-base disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Check size={18} />
          )}
          {saving ? "Enregistrement..." : "Enregistrer"}
        </motion.button>
      </div>
    </div>
  );
}
