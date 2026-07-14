import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { toast } from "sonner";
import type { Member, Expense, GroupCategory } from "../types";
import { CATEGORIES } from "../constants";
import { AvatarImg } from "./AvatarImg";

function AddExpenseSheet({
  members,
  currentMemberId,
  onAdd,
  onClose,
  customCategories,
}: {
  members: Member[];
  currentMemberId: string;
  onAdd: (expense: Omit<Expense, "id" | "date">) => void;
  onClose: () => void;
  customCategories?: GroupCategory[];
}) {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [payerId, setPayerId] = useState(currentMemberId);
  const [participants, setParticipants] = useState(members.map((m) => m.id));
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<"weekly" | "monthly" | "yearly">("monthly");

  const allCategories = [...CATEGORIES, ...(customCategories || []).map(c => ({ name: c.name, emoji: c.emoji }))];

  const toggleParticipant = (id: string) => {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Veuillez entrer un montant");
      return;
    }
    if (participants.length === 0) {
      toast.error("Sélectionnez au moins un participant");
      return;
    }
    onAdd({
      description: category.name,
      amount: parseFloat(amount),
      payerId,
      category: category.name,
      categoryEmoji: category.emoji,
      participants,
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
    });
    onClose();
  };

  const steps = [
    {
      title: "Combien avez-vous dépensé ?",
      content: (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-card/50 border border-border rounded-3xl px-6 py-6 text-5xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-2xl">MAD</span>
          </div>
          <div className="flex gap-2 justify-center">
            {[50, 100, 200, 500].map((val) => (
              <motion.button
                key={val}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAmount(val.toString())}
                className="px-4 py-2 rounded-xl bg-secondary/50 text-sm font-semibold hover:bg-secondary/70 transition-colors"
              >
                {val}
              </motion.button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "C'est pour quoi ?",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {allCategories.map((cat) => (
            <motion.button
              key={cat.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(cat)}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                category.name === cat.name
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-card/50 border border-border hover:bg-card/80"
              }`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-semibold">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: "Qui a payé ?",
      content: (
        <div className="space-y-2">
          {members.map((member) => (
            <motion.button
              key={member.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPayerId(member.id)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                payerId === member.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-card/50 border border-border hover:bg-card/80"
              }`}
            >
              <AvatarImg avatar={member.avatar} size="text-3xl" />
              <span className="font-semibold flex-1 text-left">{member.name}</span>
              {payerId === member.id && <Check size={20} />}
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: "Qui participe ?",
      content: (
        <div className="space-y-2">
          {members.map((member) => (
            <motion.button
              key={member.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleParticipant(member.id)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                participants.includes(member.id)
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-card/50 border border-border hover:bg-card/80 opacity-50"
              }`}
            >
              <AvatarImg avatar={member.avatar} size="text-3xl" />
              <span className="font-semibold flex-1 text-left">{member.name}</span>
              {participants.includes(member.id) && <Check size={20} />}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setParticipants(members.map((m) => m.id))}
            className="w-full p-3 rounded-xl bg-secondary/50 text-sm font-semibold text-center"
          >
            Tout sélectionner
          </motion.button>
        </div>
      ),
    },
    {
      title: "Dépense récurrente ?",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
            <div>
              <p className="text-sm font-semibold">Dépense récurrente</p>
              <p className="text-xs text-muted-foreground">Se répète automatiquement</p>
            </div>
            <button
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-[52px] h-8 rounded-full transition-all duration-300 relative ${
                isRecurring ? "bg-primary" : "bg-muted"
              }`}
            >
              <motion.div
                animate={{ x: isRecurring ? 22 : 2 }}
                className="absolute top-1 w-6 h-6 rounded-full bg-white shadow"
              />
            </button>
          </div>
          {isRecurring && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Fréquence</p>
              {([["weekly", "Hebdomadaire"], ["monthly", "Mensuel"], ["yearly", "Annuel"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setRecurrenceInterval(val)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    recurrenceInterval === val
                      ? "bg-primary/10 border-primary/30"
                      : "bg-card border-border"
                  }`}
                >
                  <p className="text-sm font-medium">{label}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[2.5rem] max-h-[92vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-background z-10">
          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="px-6 pb-10 space-y-6">
          {/* Progress */}
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all ${
                  i <= step ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{steps[step].title}</h2>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {steps[step].content}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {step > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-secondary text-secondary-foreground font-semibold py-4 rounded-2xl"
              >
                Retour
              </motion.button>
            )}
            {step < steps.length - 1 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !amount}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-4 rounded-2xl disabled:opacity-50"
              >
                Suivant
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={participants.length === 0}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-4 rounded-2xl disabled:opacity-50"
              >
                Confirmer
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export { AddExpenseSheet };
