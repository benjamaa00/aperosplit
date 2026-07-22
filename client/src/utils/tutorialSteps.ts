import type { TourStep } from "../components/GuidedTour";

export const MAIN_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="welcome"]',
    title: "Bienvenue dans AperoSplit",
    description: "Ceci est votre tableau de bord principal. Toutes les informations importantes de votre groupe s'affichent ici en un coup d'œil. Le nom et l'avatar en haut identifient le membre connecté.",
  },
  {
    target: '[data-tutorial="balance-summary"]',
    title: "Carte de solde",
    description: "Cette carte résume votre situation financière dans le groupe. Le montant principal indique ce que vous devez recevoir (vert) ou rembourser (rouge). Les deux cases du bas détaillent le total que vous avez payé et votre part proportionnelle dans les dépenses.",
  },
  {
    target: '[data-tutorial="recent-expenses"]',
    title: "Dépenses récentes",
    description: "Les dernières dépenses du groupe apparaissent ici par ordre chronologique. Chaque carte affiche l'emoji de catégorie, le titre, le nom du payeur et le montant. Appuyez sur une dépense pour voir les détails complets.",
  },
  {
    target: '[data-tutorial="add-expense-btn"]',
    title: "Ajouter une dépense",
    description: "Ce bouton flottant violet permet d'enregistrer un nouvel achat en un instant. Renseignez le titre, le montant, qui a payé, les participants et la catégorie. La répartition est automatiquement calculée entre tous les membres sélectionnés.",
  },
  {
    target: '[data-tutorial="pending-payments"]',
    title: "Paiements en attente",
    description: "Les demandes de remboursement en cours apparaissent ici avec un indicateur clignotant. Vous pouvez confirmer qu'un paiement a été reçu en appuyant sur la coche verte, ou refuser avec la croix rouge. Le statut évolue automatiquement.",
  },
  {
    target: '[data-tutorial="tab-bar"]',
    title: "Barre de navigation",
    description: "La barre en bas de l'écran permet de naviguer entre les 4 sections principales : Dépenses, Soldes, Statistiques et Profil. L'onglet actif est mis en surbrillance avec un fond coloré et un indicateur lumineux.",
  },
  {
    target: '[data-tutorial="tab-expenses"]',
    title: "Onglet Dépenses",
    description: "Cet onglet affiche la liste complète et chronologique de toutes les dépenses du groupe. Vous pouvez chercher, filtrer, dupliquer ou supprimer chaque dépense individuellement. La recherche instantanée se met à jour à chaque caractère tapé.",
  },
  {
    target: '[data-tutorial="expense-filter"]',
    title: "Filtrer les dépenses",
    description: "Deux options de recherche sont disponibles : la barre globale en haut ouvre un écran de recherche complet, et le champ de filtre ci-dessous trie les dépenses en temps réel par titre. Utile pour retrouver rapidement un achat spécifique parmi des dizaines.",
  },
  {
    target: '[data-tutorial="expense-quick-actions"]',
    title: "Actions rapides sur une dépense",
    description: "Le bouton « ... » sur chaque dépense ouvre un menu contextuel avec trois options : Dupliquer (pour un achat similaire), Demander un paiement, ou Supprimer. La suppression est annulable pendant 5 secondes via un toast.",
  },
  {
    target: '[data-tutorial="tab-balances"]',
    title: "Onglet Soldes",
    description: "Visualisez clairement qui doit rembourser qui et de combien. Chaque membre est affiché avec son solde coloré : vert = il doit recevoir, rouge = il doit rembourser. Appuyez sur un membre pour voir le détail complet de ses dettes.",
  },
  {
    target: '[data-tutorial="balance-simplified"]',
    title: "Remboursements optimisés",
    description: "L'algorithme de simplification réduit le nombre de transactions nécessaires. Par exemple, si A doit 50 à B et B doit 30 à C, une seule transaction A→C de 30 suffit au lieu de deux virements. Les montants et destinataires sont calculés automatiquement.",
  },
  {
    target: '[data-tutorial="tab-stats"]',
    title: "Onglet Statistiques",
    description: "Analysez les habitudes de dépenses du groupe avec des graphiques détaillés. Le camembert montre la répartition par catégorie, l'histogramme compare les contributions par membre, et le budget prévisionnel suit l'évolution mensuelle.",
  },
  {
    target: '[data-tutorial="stats-controls"]',
    title: "Période et filtres",
    description: "Filtrez les statistiques par semaine, mois, année ou depuis le début. Le bouton « Tout le groupe » ou un membre spécifique permet de voir les stats globales ou individuelles. Les graphiques se recalculent instantanément.",
  },
  {
    target: '[data-tutorial="tab-profile"]',
    title: "Onglet Profil",
    description: "Gérez votre identité, les paramètres du groupe, les notifications et l'apparence. Votre avatar et votre rôle (admin ou membre) sont affichés en haut. C'est aussi ici que vous pouvez quitter le groupe ou réinitialiser toutes les données.",
  },
  {
    target: '[data-tutorial="profile-settings"]',
    title: "Devise et Budget",
    description: "Choisissez la monnaie du groupe : MAD (Dirham marocain), EUR (Euro) ou USD (Dollar). Définissez un budget mensuel pour suivre vos dépenses dans l'onglet Statistiques. Les raccourcis de 500 à 5000 facilitent la sélection.",
  },
  {
    target: '[data-tutorial="profile-notifications"]',
    title: "Notifications et rappels",
    description: "Activez les notifications push pour recevoir des alertes sur les nouveaux paiements et dépenses. Les rappels automatiques relancent les membres en retard avec un délai configurable de 1 à 7 jours. Tout se gère depuis cette section.",
  },
  {
    target: '[data-tutorial="profile-security"]',
    title: "Sécurité et confidentialité",
    description: "Le verrouillage biométrique (Face ID / Touch ID) sécurise l'accès à l'app. Le mode privé masque les montants pour la discrétion. La section Apparence propose le thème sombre/clair et l'accès à 15 thèmes premium avec dégradés et arrière-plans uniques.",
  },
  {
    target: '[data-tutorial="profile-categories"]',
    title: "Catégories de dépenses",
    description: "Les admins peuvent gérer les catégories de dépenses : en ajouter de nouvelles, modifier les emojis et couleurs, ou archiver celles qui ne sont plus utilisées. Plus de 180 sous-catégories prédéfinies couvrent tous les besoins.",
    adminOnly: true,
  },
  {
    target: '[data-tutorial="profile-members"]',
    title: "Inviter des membres",
    description: "Générez un lien d'invitation ou un code PIN pour ajouter de nouveaux membres au groupe. Partagez-le par message, email ou QR code. Les nouveaux membres rejoignent automatiquement avec accès complet aux dépenses et soldes.",
    adminOnly: true,
  },
  {
    target: '[data-tutorial="profile-help"]',
    title: "Aide et tutoriels",
    description: "Vous pouvez revoir ce tutoriel à tout moment depuis cette section. Cliquez sur « Rejouer le tutoriel » pour relancer la visite guidée complète de l'application. Utile si vous avez oublié le fonctionnement d'une fonctionnalité.",
  },
];

export const EXPENSE_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="expense-title"]',
    title: "Titre de la dépense",
    description: "Décrivez l'achat en quelques mots, par exemple « Dîner au restaurant » ou « Course au supermarché ». Un titre clair facilite la recherche et l'identification plus tard.",
  },
  {
    target: '[data-tutorial="expense-amount"]',
    title: "Montant",
    description: "Entrez le montant total de la dépense en dirhams (MAD). L'application calculera automatiquement la part de chaque participant. Vous pouvez entrer des décimales.",
  },
  {
    target: '[data-tutorial="expense-payer"]',
    title: "Qui a payé ?",
    description: "Choisissez la personne qui a avancé l'argent. C'est cette personne qui sera remboursée par les autres. Un seul payeur par dépense.",
  },
  {
    target: '[data-tutorial="expense-participants"]',
    title: "Participants",
    description: "Sélectionnez les membres concernés par cette dépense. Seuls ces membres seront comptés dans le calcul de la répartition. Par défaut, tous les membres sont sélectionnés.",
  },
  {
    target: '[data-tutorial="expense-category"]',
    title: "Catégorie",
    description: "Choisissez une catégorie pour classer la dépense. Les catégories aident à analyser vos statistiques et à visualiser où va l'argent du groupe. Plus de 180 sous-catégories sont disponibles.",
  },
  {
    target: '[data-tutorial="expense-split"]',
    title: "Répartition",
    description: "La répartition égale divise le montant parts égales entre tous les participants. Vous pouvez aussi personnaliser les parts individuellement si certains membres ont consommé plus.",
  },
  {
    target: '[data-tutorial="expense-submit"]',
    title: "Valider",
    description: "Enregistrez la dépense. Elle apparaîtra immédiatement dans la liste des dépenses et les soldes de tous les membres seront recalculés automatiquement.",
  },
];

export const BALANCES_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="balance-card"]',
    title: "Solde d'un membre",
    description: "Un montant positif (vert) signifie que cette personne doit recevoir de l'argent. Un montant négatif (rouge) signifie qu'elle doit rembourser. Appuyez pour envoyer une demande de paiement.",
  },
  {
    target: '[data-tutorial="simplified-debts"]',
    title: "Simplification des dettes",
    description: "L'application optimise automatiquement les remboursements pour réduire le nombre de transactions nécessaires. Vous verrez uniquement les paiements qui doivent réellement avoir lieu.",
  },
  {
    target: '[data-tutorial="request-payment"]',
    title: "Demander un remboursement",
    description: "Envoyez une demande de paiement directement depuis la page des soldes. Le membre recevra une notification et pourra confirmer le paiement une fois effectué.",
  },
];

export const STATS_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="stats-period"]',
    title: "Période",
    description: "Filtrez les statistiques par semaine, mois, année ou depuis le début. Le comparateur affiche l'évolution par rapport à la période précédente.",
  },
  {
    target: '[data-tutorial="stats-total"]',
    title: "Total et tendance",
    description: "Le montant total dépensé sur la période sélectionnée, avec la variation en pourcentage par rapport à la période précédente. Une tendance verte signifie une baisse, rouge une hausse.",
  },
  {
    target: '[data-tutorial="stats-pie"]',
    title: "Répartition par catégorie",
    description: "Le graphique circulaire montre la répartition de vos dépenses par type. Appuyez sur un segment pour voir le détail. Les catégories les plus importantes apparaissent en premier.",
  },
  {
    target: '[data-tutorial="stats-bar"]',
    title: "Dépenses par membre",
    description: "L'histogramme horizontal compare les contributions de chaque membre du groupe. Visualisez qui dépense le plus et identifiez les déséquilibres éventuels.",
  },
  {
    target: '[data-tutorial="stats-budget"]',
    title: "Budget prévisionnel",
    description: "Suivez l'évolution de vos dépenses par rapport au budget mensuel défini. La barre de progression montre le pourcentage consommé. Un dépassement est signalé en rouge.",
  },
];

export const PAYMENTS_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="payment-status"]',
    title: "Statut du paiement",
    description: "Chaque demande passe par plusieurs étapes : en attente (le payeur n'a pas encore payé), payé (le payeur confirme avoir payé), puis confirmé par le créancier (la dette est soldée).",
  },
  {
    target: '[data-tutorial="payment-actions"]',
    title: "Actions disponibles",
    description: "Confirmer si vous avez reçu l'argent, refuser si le montant est incorrect, relancer pour rappeler au débiteur, ou annuler si la demande n'est plus d'actualité.",
  },
];

export const CATEGORIES_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="cat-list"]',
    title: "Liste des catégories",
    description: "Les catégories organisent vos dépenses par thème. Chaque catégorie a un emoji et une couleur. Les sous-catégories permettent un classement encore plus précis.",
  },
  {
    target: '[data-tutorial="cat-add"]',
    title: "Ajouter une catégorie",
    description: "Créez de nouvelles catégories personnalisées pour mieux organiser vos dépenses. Choisissez un nom, un emoji et une couleur. Réservé aux administrateurs du groupe.",
    adminOnly: true,
  },
  {
    target: '[data-tutorial="cat-edit"]',
    title: "Modifier ou archiver",
    description: "Modifiez le nom, l'emoji ou la couleur d'une catégorie. Vous pouvez aussi l'archiver pour la masquer. Les dépenses existantes conservent leur catégorie d'origine même après modification.",
    adminOnly: true,
  },
];

export const PROFILE_TUTORIAL: TourStep[] = [
  {
    target: '[data-tutorial="profile-avatar"]',
    title: "Votre avatar",
    description: "Touchez votre photo de profil pour la modifier. Vous pouvez choisir un emoji ou télécharger une photo. Votre avatar est visible par tous les membres du groupe.",
  },
  {
    target: '[data-tutorial="profile-theme"]',
    title: "Thème",
    description: "Changez l'apparence de l'application parmi les 15 thèmes disponibles. Chaque thème propose une palette de couleurs et un dégradé d'arrière-plan unique.",
  },
  {
    target: '[data-tutorial="profile-members"]',
    title: "Gestion des membres",
    description: "Ajoutez, retirez ou gérez les rôles des membres du groupe. Les admins peuvent promouvoir ou rétrograder les membres. Réservé aux administrateurs.",
    adminOnly: true,
  },
  {
    target: '[data-tutorial="profile-settings"]',
    title: "Réglages",
    description: "Configurez le budget mensuel, la monnaie du groupe, les notifications push, les rappels automatiques et les préférences de confidentialité.",
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
