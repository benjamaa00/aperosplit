import type { TourStep } from "../components/GuidedTour";

export const MAIN_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="welcome"]',
    title: "Bienvenue dans AperoSplit",
    description: "L'application vous aide à enregistrer, répartir et équilibrer les dépenses de votre groupe.",
  },
  {
    target: '[data-tutorial="balance-summary"]',
    title: "Votre solde",
    description: "Cette carte résume ce que vous devez recevoir ou rembourser. Un montant positif signifie qu'on vous doit de l'argent.",
  },
  {
    target: '[data-tutorial="recent-expenses"]',
    title: "Dépenses récentes",
    description: "Les dernières dépenses du groupe apparaissent ici. Touchez une dépense pour voir les détails.",
  },
  {
    target: '[data-tutorial="pending-payments"]',
    title: "Paiements en attente",
    description: "Les demandes de remboursement en cours sont visibles ici. Vous pouvez confirmer ou refuser un paiement.",
  },
  {
    target: '[data-tutorial="add-expense-btn"]',
    title: "Ajouter une dépense",
    description: "Utilisez ce bouton pour enregistrer un achat et choisir qui a payé et comment répartir le montant.",
  },
  {
    target: '[data-tutorial="tab-expenses"]',
    title: "Onglet Dépenses",
    description: "Consultez, recherchez, modifiez ou dupliquez toutes les dépenses du groupe.",
  },
  {
    target: '[data-tutorial="tab-balances"]',
    title: "Onglet Soldes",
    description: "Visualisez clairement qui doit rembourser qui et de combien.",
  },
  {
    target: '[data-tutorial="tab-stats"]',
    title: "Onglet Statistiques",
    description: "Analysez les dépenses par période, catégorie et membre avec des graphiques détaillés.",
  },
  {
    target: '[data-tutorial="tab-profile"]',
    title: "Profil et réglages",
    description: "Modifiez votre profil, vos préférences, le thème et les réglages du groupe.",
  },
];

export const EXPENSE_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="expense-title"]',
    title: "Titre de la dépense",
    description: "Décrivez l'achat en quelques mots, par exemple \"Dîner au restaurant\".",
  },
  {
    target: '[data-tutorial="expense-amount"]',
    title: "Montant",
    description: "Entrez le montant total de la dépense en dirhams (MAD).",
  },
  {
    target: '[data-tutorial="expense-payer"]',
    title: "Qui a payé ?",
    description: "Choisissez la personne qui a avancé l'argent. L'application calculera ensuite ce que chaque membre doit rembourser.",
  },
  {
    target: '[data-tutorial="expense-participants"]',
    title: "Participants",
    description: "Sélectionnez les membres concernés par cette dépense. Seuls ces membres seront comptés dans le calcul.",
  },
  {
    target: '[data-tutorial="expense-category"]',
    title: "Catégorie",
    description: "Choisissez une catégorie pour classer la dépense. Les catégories aident à analyser vos statistiques.",
  },
  {
    target: '[data-tutorial="expense-split"]',
    title: "Répartition",
    description: "La répartition égale divise le montant entre tous les participants. Vous pouvez aussi personnaliser les parts.",
  },
  {
    target: '[data-tutorial="expense-submit"]',
    title: "Valider",
    description: "Enregistrez la dépense. Elle apparaîtra immédiatement dans la liste et les soldes seront recalculés.",
  },
];

export const BALANCES_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="balance-card"]',
    title: "Solde d'un membre",
    description: "Un montant positif (vert) signifie que cette personne doit recevoir. Un montant négatif (rouge) signifie qu'elle doit rembourser.",
  },
  {
    target: '[data-tutorial="simplified-debts"]',
    title: "Simplification des dettes",
    description: "L'application optimise automatiquement les remboursements pour réduire le nombre de transactions nécessaires.",
  },
  {
    target: '[data-tutorial="request-payment"]',
    title: "Demander un remboursement",
    description: "Envoyez une demande de paiement directement depuis cette page pour accélérer le règlement.",
  },
];

export const STATS_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="stats-period"]',
    title: "Période",
    description: "Filtrez les statistiques par semaine, mois, année ou depuis le début.",
  },
  {
    target: '[data-tutorial="stats-total"]',
    title: "Total et tendance",
    description: "Le montant total dépensé et la comparaison avec la période précédente.",
  },
  {
    target: '[data-tutorial="stats-pie"]',
    title: "Répartition par catégorie",
    description: "Le camembert montre la répartition de vos dépenses par type de dépense.",
  },
  {
    target: '[data-tutorial="stats-bar"]',
    title: "Dépenses par membre",
    description: "Comparez les contributions de chaque membre du groupe.",
  },
  {
    target: '[data-tutorial="stats-budget"]',
    title: "Budget prévisionnel",
    description: "Suivez l'évolution de vos dépenses par rapport au budget mensuel défini.",
  },
];

export const PAYMENTS_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="payment-status"]',
    title: "Statut du paiement",
    description: "Chaque demande passe par plusieurs étapes : en attente, payé, puis confirmé par le créancier.",
  },
  {
    target: '[data-tutorial="payment-actions"]',
    title: "Actions disponibles",
    description: "Confirmer, refuser, relancer ou annuler une demande de paiement selon votre situation.",
  },
];

export const CATEGORIES_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="cat-list"]',
    title: "Liste des catégories",
    description: "Les catégories organisent vos dépenses. Chaque catégorie peut avoir plusieurs sous-catégories.",
  },
  {
    target: '[data-tutorial="cat-add"]',
    title: "Ajouter une catégorie",
    description: "Créez de nouvelles catégories personnalisées pour mieux organiser vos dépenses. Réservé aux administrateurs.",
    adminOnly: true,
  },
  {
    target: '[data-tutorial="cat-edit"]',
    title: "Modifier ou archiver",
    description: "Modifiez le nom, l'emoji ou archivez une catégorie. Les dépenses existantes conservent leur catégorie d'origine.",
    adminOnly: true,
  },
];

export const PROFILE_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="profile-avatar"]',
    title: "Votre avatar",
    description: "Touchez votre photo pour la modifier. Utilisez un emoji ou une photo.",
  },
  {
    target: '[data-tutorial="profile-theme"]',
    title: "Thème",
    description: "Changez l'apparence de l'application parmi les thèmes disponibles.",
  },
  {
    target: '[data-tutorial="profile-members"]',
    title: "Gestion des membres",
    description: "Ajoutez, retirez ou gérez les rôles des membres du groupe.",
    adminOnly: true,
  },
  {
    target: '[data-tutorial="profile-settings"]',
    title: "Réglages",
    description: "Configurez le budget, la monnaie, les notifications et les préférences de confidentialité.",
  },
];

export const ALL_TUTORIALS = {
  main: { steps: MAIN_TUTORIAL, label: "Tutoriel principal" },
  expense: { steps: EXPENSE_TUTORIAL, label: "Ajouter une dépense" },
  balances: { steps: BALANCES_TUTORIAL, label: "Comprendre les soldes" },
  stats: { steps: STATS_TUTORIAL, label: "Comprendre les statistiques" },
  payments: { steps: PAYMENTS_TUTORIAL, label: "Comprendre les paiements" },
  categories: { steps: CATEGORIES_TUTORIAL, label: "Gestion des catégories" },
  profile: { steps: PROFILE_TUTORIAL, label: "Profil et réglages" },
} as const;
