import { Toggle } from "./Toggle";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import type { Member, Expense, GroupCategory } from "../types";
import { CATEGORY_SECTIONS, CATEGORIES } from "../constants";
import { AvatarImg } from "./AvatarImg";
import { haptics } from "../utils/haptics";
import { SuccessAnimation } from "./success-animation";
import { getAISuggestions } from "../utils/ai-suggestions";
import { formatCurrency } from "../utils/currency";

function AddExpenseSheet({
  members,
  currentMemberId,
  onAdd,
  onClose,
  customCategories,
  categories,
  currency,
  duplicateFrom,
  allExpenses,
}: {
  members: Member[];
  currentMemberId: string;
  onAdd: (expense: Omit<Expense, "id" | "date">) => void;
  onClose: () => void;
  customCategories?: GroupCategory[];
  categories: GroupCategory[];
  currency?: string;
  duplicateFrom?: Expense | null;
  allExpenses?: Expense[];
}) {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<{ name: string; emoji: string }>(CATEGORIES[0]);
  const [payerId, setPayerId] = useState(currentMemberId);
  const [participants, setParticipants] = useState(members.map((m) => m.id));
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [categorySearch, setCategorySearch] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const displayCurrency = currency || "MAD";

  useEffect(() => {
    if (!duplicateFrom) return;
    setAmount(duplicateFrom.amount.toString());
    setDescription(duplicateFrom.description);
    setCategory({ name: duplicateFrom.category, emoji: duplicateFrom.categoryEmoji });
    setPayerId(duplicateFrom.payerId);
    setParticipants(duplicateFrom.participants.length > 0 ? [...duplicateFrom.participants] : members.map(m => m.id));
    setIsRecurring(!!duplicateFrom.isRecurring);
    if (duplicateFrom.recurrenceInterval) {
      setRecurrenceInterval(duplicateFrom.recurrenceInterval as "weekly" | "monthly" | "yearly");
    }
    toast.info("Mode duplication", { description: "Modifiez les champs puis confirmez" });
  }, [duplicateFrom]); // eslint-disable-line react-hooks/exhaustive-deps

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
      description: description.trim() || category.name,
      amount: parseFloat(amount),
      payerId,
      category: category.name,
      categoryEmoji: category.emoji,
      participants,
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
    });
    haptics.success();
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  const handleCategorySelect = (name: string, emoji: string) => {
    setCategory({ name, emoji });
    setStep(2);
  };

  const activeCategories = useMemo(
    () => (categories || []).filter((c) => c.isActive),
    [categories]
  );

  const filteredDynamicCategories = useMemo(() => {
    if (!categorySearch.trim()) return activeCategories;
    const q = categorySearch.toLowerCase();
    return activeCategories.filter((cat) => {
      const nameMatch = cat.name.toLowerCase().includes(q);
      const subMatch = cat.subcategories.some((s) => s.name.toLowerCase().includes(q));
      return nameMatch || subMatch;
    });
  }, [activeCategories, categorySearch]);

  const filteredStaticSections = useMemo(() => {
    if (!categorySearch.trim()) return CATEGORY_SECTIONS;
    const q = categorySearch.toLowerCase();
    return CATEGORY_SECTIONS.filter((section) => {
      const titleMatch = section.title.toLowerCase().includes(q);
      const itemMatch = section.items.some((item) => item.name.toLowerCase().includes(q));
      return titleMatch || itemMatch;
    }).map((section) => ({
      ...section,
      items: section.items.filter((item) => item.name.toLowerCase().includes(q)),
    }));
  }, [categorySearch]);

  const useDynamic = activeCategories.length > 0;

  const suggestions = useMemo(() => {
    if (!description.trim()) return null;
    return getAISuggestions(description, amount ? parseFloat(amount) : null, allExpenses || [], categories);
  }, [description, amount, allExpenses, categories]);

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
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-2xl">{displayCurrency}</span>
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
        <div className="space-y-5 max-h-[55vh] overflow-y-auto -mx-1 px-1 scrollbar-thin">
          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Rechercher une catégorie..."
              className="w-full bg-card/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            {categorySearch && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => setCategorySearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-secondary/50 flex items-center justify-center"
              >
                <X size={9} />
              </motion.button>
            )}
          </div>

          {useDynamic ? (
            filteredDynamicCategories.map((cat) => {
              const hasSubs = cat.subcategories.length > 0;
              const isExpanded = expandedCategoryId === cat.id;
              return (
                <div key={cat.id}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (hasSubs) {
                        setExpandedCategoryId(isExpanded ? null : cat.id);
                      } else {
                        handleCategorySelect(cat.name, cat.emoji);
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 ${
                      category.name === cat.name && !hasSubs
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/40"
                        : "bg-card/60 border border-border/50 hover:bg-card hover:border-border"
                    }`}
                  >
                    <span className="text-2xl shrink-0">{cat.emoji}</span>
                    <span className="text-[13px] font-semibold flex-1 text-left">{cat.name}</span>
                    {hasSubs && (
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                        <ChevronRight size={14} className="text-muted-foreground" />
                      </motion.div>
                    )}
                    {!hasSubs && category.name === cat.name && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                        <Check size={10} className="text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {hasSubs && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-2 pt-2 pl-6">
                          {cat.subcategories
                            .filter((s) => s.isActive)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((sub) => {
                              const isSelected = category.name === sub.name;
                              return (
                                <motion.button
                                  key={sub.id}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => handleCategorySelect(sub.name, sub.emoji || cat.emoji)}
                                  className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/40"
                                      : "bg-card/40 border border-border/40 hover:bg-card/70"
                                  }`}
                                >
                                  <span className="text-lg shrink-0">{sub.emoji || cat.emoji}</span>
                                  <span className={`text-xs font-semibold text-left ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                                    {sub.name}
                                  </span>
                                  {isSelected && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 rounded-full bg-primary-foreground/20 flex items-center justify-center ml-auto">
                                      <Check size={8} className="text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </motion.button>
                              );
                            })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            filteredStaticSections.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-lg">{section.emoji}</span>
                  <h3 className="text-sm font-bold text-foreground tracking-wide">{section.title}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {section.items.map((item) => {
                    const isSelected = category.name === item.name && category.emoji === item.emoji;
                    return (
                      <motion.button
                        key={item.name}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleCategorySelect(item.name, item.emoji)}
                        className={`relative flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/40"
                            : "bg-card/60 border border-border/50 hover:bg-card hover:border-border active:bg-card/80"
                        }`}
                      >
                        <span className="text-2xl shrink-0">{item.emoji}</span>
                        <span className={`text-[13px] font-semibold leading-tight text-left ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                          {item.name}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center"
                          >
                            <Check size={10} className="text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      title: "Description (optionnel)",
      content: (
        <div className="space-y-4">
          <input
            type="text"
            placeholder={category.name}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus
            className="w-full bg-card/50 border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all"
          />
          <p className="text-xs text-muted-foreground text-center">
            Laissez vide pour utiliser "{category.name}"
          </p>

          {suggestions?.suggestedCategory && suggestions.confidence > 0.6 && suggestions.suggestedCategory.name !== category.name && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs"
            >
              <span className="text-primary font-medium">Suggestion:</span>
              <button
                onClick={() => setCategory({ name: suggestions.suggestedCategory!.name, emoji: suggestions.suggestedCategory!.emoji })}
                className="flex items-center gap-1 hover:underline"
              >
                <span>{suggestions.suggestedCategory.emoji}</span>
                <span>{suggestions.suggestedCategory.name}</span>
              </button>
            </motion.div>
          )}

          {suggestions?.duplicateWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs"
            >
              <span className="text-yellow-600 font-medium">Doublon possible:</span>
              <span className="text-muted-foreground">
                {suggestions.duplicateWarning.description} - {formatCurrency(suggestions.duplicateWarning.amount)} le {new Date(suggestions.duplicateWarning.date).toLocaleDateString("fr-FR")}
              </span>
            </motion.div>
          )}
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
            <Toggle enabled={isRecurring} onToggle={() => setIsRecurring(!isRecurring)} />
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

  const currentStepIndex = step === 1 ? 1 : step;

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
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[2.5rem] max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="px-6 pb-10 flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Progress */}
          <div className="flex items-center gap-2 shrink-0">
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
          <div className="flex items-center justify-between mt-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    if (step === 1) setCategorySearch("");
                    setStep(step > 1 ? step - 1 : 0);
                  }}
                  aria-label="Retour"
                  className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
                >
                  <ChevronLeft size={16} />
                </motion.button>
              )}
              <h2 className="text-xl font-bold">{steps[step].title}</h2>
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              aria-label="Fermer"
              className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Selected category chip */}
          {step > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 mb-4 shrink-0"
            >
              <span className="text-2xl">{category.emoji}</span>
              <div>
                <p className="text-xs text-primary/60 font-medium">Catégorie</p>
                <p className="text-sm font-bold text-primary">{category.name}</p>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {steps[step].content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4 shrink-0">
            {step !== 1 && (
              step < steps.length - 1 ? (
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
              )
            )}
            {step === 1 && (
              <p className="flex-1 text-center text-sm text-muted-foreground py-4">
                Sélectionnez une catégorie ci-dessus
              </p>
            )}
          </div>
        </div>
      </motion.div>
      <SuccessAnimation show={showSuccess} />
    </motion.div>
  );
}

export { AddExpenseSheet };
