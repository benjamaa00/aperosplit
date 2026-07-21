import type { Expense, GroupCategory } from "../types";

const KEYWORD_MAP: Record<string, string[]> = {
  "restaurant": ["Restauration"],
  "repas": ["Restauration"],
  "dejeuner": ["Restauration"],
  "dinner": ["Restauration"],
  "pizza": ["Restauration"],
  "sushi": ["Restauration"],
  "kebab": ["Restauration"],
  "cafe": ["Boissons"],
  "the": ["Boissons"],
  "biere": ["Boissons"],
  "vin": ["Boissons"],
  "boisson": ["Boissons"],
  "taxi": ["Transport"],
  "uber": ["Transport"],
  "carburant": ["Transport"],
  "essence": ["Transport"],
  "petrole": ["Transport"],
  "parking": ["Transport"],
  "metro": ["Transport"],
  "bus": ["Transport"],
  "train": ["Transport"],
  "vol": ["Voyage"],
  "avion": ["Voyage"],
  "hotel": ["Voyage"],
  "hebergement": ["Voyage"],
  "airbnb": ["Voyage"],
  "marche": ["Courses"],
  "supermarche": ["Courses"],
  "epicerie": ["Courses"],
  "carrefour": ["Courses"],
  "cinema": ["Loisirs"],
  "concert": ["Loisirs"],
  "theatre": ["Loisirs"],
  "spectacle": ["Loisirs"],
  "jeu": ["Loisirs"],
  "sport": ["Loisirs"],
  "facture": ["Factures"],
  "loyer": ["Factures"],
  "electricite": ["Factures"],
  "eau": ["Factures"],
  "internet": ["Factures"],
  "telephone": ["Factures"],
  "medicament": ["Sante"],
  "pharmacie": ["Sante"],
  "docteur": ["Sante"],
  "medecin": ["Sante"],
  "hopital": ["Sante"],
  "cadeau": ["Divers"],
  "gift": ["Divers"],
  "decor": ["Divers"],
  "amenagement": ["Divers"],
};

export interface SuggestionResult {
  suggestedCategory: GroupCategory | null;
  confidence: number;
  similarExpenses: Expense[];
  duplicateWarning: Expense | null;
  nameSuggestions: string[];
}

export function getAISuggestions(
  description: string,
  amount: number | null,
  allExpenses: Expense[],
  categories: GroupCategory[],
  currentExpenseId?: string,
): SuggestionResult {
  const desc = (description || "").toLowerCase().trim();

  let suggestedCategory: GroupCategory | null = null;
  let confidence = 0;

  if (desc.length >= 2) {
    const matchedCategoryNames = new Set<string>();
    for (const [keyword, catNames] of Object.entries(KEYWORD_MAP)) {
      if (desc.includes(keyword.toLowerCase())) {
        for (const catName of catNames) {
          matchedCategoryNames.add(catName);
        }
      }
    }

    if (matchedCategoryNames.size > 0) {
      const matched: GroupCategory[] = [];
      Array.from(matchedCategoryNames).forEach(catName => {
        const found = categories.find(c =>
          c.name.toLowerCase().includes(catName.toLowerCase())
        );
        if (found) matched.push(found);
      });

      if (matched.length === 1) {
        suggestedCategory = matched[0];
        confidence = 0.9;
      } else if (matched.length > 1) {
        const freq = new Map<string, number>();
        for (const e of allExpenses) {
          const foundCat = matched.find(c => c.name === e.category);
          if (foundCat) {
            freq.set(foundCat.id, (freq.get(foundCat.id) || 0) + 1);
          }
        }
        const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          suggestedCategory = matched.find(c => c.id === sorted[0][0]) || matched[0];
          confidence = 0.7;
        } else {
          suggestedCategory = matched[0];
          confidence = 0.6;
        }
      }
    }

    if (!suggestedCategory && desc.length >= 3) {
      const categoryFreq = new Map<string, number>();
      for (const e of allExpenses) {
        if (e.description?.toLowerCase().includes(desc.substring(0, Math.min(desc.length, 5)))) {
          categoryFreq.set(e.category, (categoryFreq.get(e.category) || 0) + 1);
        }
      }
      const sorted = Array.from(categoryFreq.entries()).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0 && sorted[0][1] >= 2) {
        const catName = sorted[0][0];
        suggestedCategory = categories.find(c => c.name === catName) || null;
        confidence = 0.5;
      }
    }
  }

  const similarExpenses = allExpenses
    .filter(e => e.id !== currentExpenseId)
    .filter(e => {
      if (desc.length < 3) return false;
      return e.description?.toLowerCase().includes(desc);
    })
    .slice(0, 5);

  let duplicateWarning: Expense | null = null;
  if (amount && amount > 0 && desc.length >= 2) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    duplicateWarning = allExpenses.find(e =>
      e.id !== currentExpenseId &&
      Math.abs(e.amount - amount) < 0.01 &&
      e.description?.toLowerCase().includes(desc) &&
      new Date(e.date) > thirtyDaysAgo
    ) || null;
  }

  const nameSuggestions: string[] = [];
  if (desc.length >= 2) {
    const descriptions = allExpenses
      .map(e => e.description)
      .filter((d): d is string => !!d && d.length >= 2);

    const descFreq = new Map<string, number>();
    for (const d of descriptions) {
      const normalized = d.toLowerCase().trim();
      descFreq.set(normalized, (descFreq.get(normalized) || 0) + 1);
    }

    const sorted = Array.from(descFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    for (const [d] of sorted) {
      if (!nameSuggestions.includes(d) && d !== desc) {
        nameSuggestions.push(d);
      }
    }
  }

  return { suggestedCategory, confidence, similarExpenses, duplicateWarning, nameSuggestions };
}
