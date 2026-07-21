import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Shuffle, Sparkles, Check, X, Image as ImageIcon,
  Smile, Upload,
} from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/[0.07] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-6 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {step === "avatar" && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setStep("name")}
              className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </motion.button>
          )}
          {step === "name" && onBack && (
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </motion.button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {step === "name" ? "Rejoindre le groupe" : "Choisissez votre avatar"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {step === "name"
                ? groupName ? `Rejoignez "${groupName}"` : "Créez votre profil"
                : "Soyez créatif !"}
            </p>
          </div>
          {/* Step indicators */}
          <div className="flex gap-1.5">
            <div className={`w-8 h-1.5 rounded-full transition-all ${step === "name" ? "bg-primary" : "bg-primary/40"}`} />
            <div className={`w-8 h-1.5 rounded-full transition-all ${step === "avatar" ? "bg-primary" : "bg-muted"}`} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Name */}
          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-6">
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-2 block uppercase tracking-wide">
                    Votre nom ou nickname
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                    placeholder="Ex: Mohamed, Momo, Mo..."
                    autoFocus
                    className="w-full bg-card/50 border border-border rounded-2xl px-5 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all placeholder:text-muted-foreground/40"
                  />
                  <p className="text-[11px] text-muted-foreground mt-2 ml-1">
                    C'est ainsi que les autres membres vous verront
                  </p>
                </div>
              </div>

              <motion.button
                onClick={handleNameNext}
                disabled={!name.trim()}
                className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-xl shadow-primary/25 text-base disabled:opacity-40 disabled:shadow-none mt-4"
              >
                Continuer
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Avatar */}
          {step === "avatar" && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex-1 flex flex-col"
            >
              {/* Avatar Preview */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30 shadow-xl shadow-primary/10 overflow-hidden">
                    {avatarMode === "photo" && photoPreview ? (
                      <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">{avatar}</span>
                    )}
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-primary/10 blur-xl -z-10"
                  />
                </motion.div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mb-4">
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

              {/* Emoji mode toggle */}
              {avatarMode === "photo" && photoPreview && (
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setAvatarMode("emoji"); setPhotoPreview(null); setAvatar("👤"); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/30 text-sm font-medium text-muted-foreground mb-4"
                >
                  <X size={14} />
                  Retirer la photo
                </motion.button>
              )}

              {/* Emoji categories */}
              <div className="flex-1 overflow-y-auto">
                {/* Category tabs */}
                <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
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

                {/* Emoji grid */}
                <div className="grid grid-cols-8 gap-1.5">
                  {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji) => (
                    <motion.button
                      key={emoji}
                      onClick={() => {
                        setAvatar(emoji);
                        setAvatarMode("emoji");
                        setPhotoPreview(null);
                      }}
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
                    className="flex-1 bg-card/30 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* Custom emojis */}
                {customEmojis.length > 0 && (
                  <div className="grid grid-cols-8 gap-1.5 mt-2">
                    {customEmojis.map((emoji, i) => (
                      <motion.button
                        key={`${emoji}-${i}`}
                        onClick={() => {
                          setAvatar(emoji);
                          setAvatarMode("emoji");
                          setPhotoPreview(null);
                        }}
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
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button (avatar step) */}
        {step === "avatar" && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleSubmit}
            className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-xl shadow-primary/25 text-base mt-4 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            Rejoindre le groupe
          </motion.button>
        )}
      </div>
    </div>
  );
}
