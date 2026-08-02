import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Camera, Shuffle, Sparkles, X, Image as ImageIcon,
} from "lucide-react";
import { AuthShell, AUTH_EASE, AUTH_ITEM_VARIANTS } from "./AuthShell";

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

const RANDOM_AVATARS = [
  "🦊", "🐱", "🐶", "🦁", "🐸", "🐵", "🤖", "👽", "🎃", "💎",
  "🔥", "⭐", "🚀", "🎯", "🎨", "🎵", "🦄", "🐲", "🦋", "🐙",
  "👨‍🚀", "👩‍💻", "🧑‍🏭", "👨‍🍳", "👩‍🎤", "💀", "😈", "🥳", "🤩", "😎",
];

interface RegisterScreenProps {
  onRegister: (name: string, avatar: string) => void;
  onBack?: () => void;
  groupName?: string;
}

const STEP_VARIANTS = {
  enter: { opacity: 0, x: 26 },
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: AUTH_EASE } },
  exit: { opacity: 0, x: -26, transition: { duration: 0.22, ease: AUTH_EASE } },
};

export function RegisterScreen({ onRegister, onBack, groupName }: RegisterScreenProps) {
  const [step, setStep] = useState<"name" | "avatar">("name");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("👤");
  const [avatarMode, setAvatarMode] = useState<"emoji" | "photo">("emoji");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [customEmojis, setCustomEmojis] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return;
    }
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
        setAvatar(compressed);
        setAvatarMode("photo");
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRandomAvatar = useCallback(() => {
    const available = RANDOM_AVATARS.filter((e) => e !== avatar);
    const random = available[Math.floor(Math.random() * available.length)];
    setAvatar(random);
    setAvatarMode("emoji");
    setPhotoPreview(null);
  }, [avatar]);

  const handleSubmit = () => {
    if (name.trim()) {
      onRegister(name.trim(), avatar);
    }
  };

  const handleNameNext = () => {
    if (name.trim()) {
      setStep("avatar");
    }
  };

  const displayAvatar = avatarMode === "photo" && photoPreview ? photoPreview : avatar;

  return (
    <AuthShell flow>
      {/* Header */}
      <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-6 flex items-center gap-3">
        {(step === "avatar" || onBack) && (
          <button
            type="button"
            onClick={() => (step === "avatar" ? setStep("name") : onBack?.())}
            aria-label="Retour"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card/40 backdrop-blur-sm transition-colors hover:bg-card/70"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            {step === "name" ? "Rejoindre le groupe" : "Choisissez votre avatar"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {step === "name"
              ? groupName ? `Rejoignez "${groupName}"` : "Créez votre profil"
              : "Soyez créatif !"}
          </p>
        </div>
        <div className="flex gap-1.5">
          <div className={`h-1.5 w-8 rounded-full transition-all ${step === "name" ? "bg-primary" : "bg-primary/40"}`} />
          <div className={`h-1.5 w-8 rounded-full transition-all ${step === "avatar" ? "bg-primary" : "bg-muted"}`} />
        </div>
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        {step === "name" ? (
          <motion.div
            key="name"
            variants={STEP_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-1 flex-col"
          >
            <div className="flex flex-1 flex-col justify-center space-y-6">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Votre nom ou nickname
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                  placeholder="Ex: Mohamed, Momo, Mo..."
                  autoFocus
                  className="w-full rounded-2xl border border-border bg-card/50 px-5 py-4 text-lg font-medium transition-all placeholder:text-muted-foreground/40 focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="ml-1 mt-2 text-[11px] text-muted-foreground">
                  C'est ainsi que les autres membres vous verront
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNameNext}
              disabled={!name.trim()}
              className="auth-cta mt-4"
            >
              Continuer
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="avatar"
            variants={STEP_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Avatar preview */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="auth-avatar-ring" />
                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl shadow-primary/10">
                  {avatarMode === "photo" && photoPreview ? (
                    <img src={photoPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-6xl">{avatar}</span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={handleRandomAvatar}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card/40 py-3 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-card/70"
              >
                <Shuffle size={16} className="text-primary" />
                Aléatoire
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card/40 py-3 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-card/70"
              >
                <Camera size={16} className="text-primary" />
                Selfie
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card/40 py-3 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-card/70"
              >
                <ImageIcon size={16} className="text-primary" />
                Photo
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {/* Remove photo */}
            {avatarMode === "photo" && photoPreview && (
              <button
                type="button"
                onClick={() => { setAvatarMode("emoji"); setPhotoPreview(null); setAvatar("👤"); }}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-muted/30 py-2.5 text-sm font-medium text-muted-foreground"
              >
                <X size={14} />
                Retirer la photo
              </button>
            )}

            {/* Emoji categories */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                {EMOJI_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(i)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedCategory === i
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "border border-border bg-card/40 text-muted-foreground"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-8 gap-1.5">
                {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setAvatar(emoji);
                      setAvatarMode("emoji");
                      setPhotoPreview(null);
                    }}
                    className={`flex aspect-square items-center justify-center rounded-xl text-xl transition-all ${
                      avatar === emoji && avatarMode === "emoji"
                        ? "scale-110 border-2 border-primary bg-primary/20 shadow-md shadow-primary/20"
                        : "border border-transparent bg-card/30 hover:bg-card/60"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Custom emoji input */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ou collez un emoji ici..."
                  maxLength={4}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !customEmojis.includes(val)) {
                        setCustomEmojis((prev) => [...prev, val]);
                        setAvatar(val);
                        setAvatarMode("emoji");
                        setPhotoPreview(null);
                      }
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                  className="w-full flex-1 rounded-xl border border-border bg-card/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              {/* Custom emojis */}
              {customEmojis.length > 0 && (
                <div className="mt-2 grid grid-cols-8 gap-1.5">
                  {customEmojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      type="button"
                      onClick={() => {
                        setAvatar(emoji);
                        setAvatarMode("emoji");
                        setPhotoPreview(null);
                      }}
                      className={`flex aspect-square items-center justify-center rounded-xl text-xl transition-all ${
                        avatar === emoji && avatarMode === "emoji"
                          ? "scale-110 border-2 border-primary bg-primary/20 shadow-md shadow-primary/20"
                          : "border border-transparent bg-card/30 hover:bg-card/60"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              className="auth-cta mt-4"
            >
              <Sparkles size={18} />
              Rejoindre le groupe
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
