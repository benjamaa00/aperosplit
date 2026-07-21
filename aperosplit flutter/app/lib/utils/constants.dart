class CategorySection {
  final String title;
  final String emoji;
  final List<CategoryItem> items;

  const CategorySection({
    required this.title,
    required this.emoji,
    required this.items,
  });
}

class CategoryItem {
  final String name;
  final String emoji;

  const CategoryItem({required this.name, required this.emoji});
}

const List<CategorySection> categorySections = [
  CategorySection(
    title: 'Nourriture et boissons',
    emoji: '🍽️',
    items: [
      CategoryItem(name: 'Courses', emoji: '🛒'),
      CategoryItem(name: 'Restaurants', emoji: '🍽️'),
      CategoryItem(name: 'Café', emoji: '☕'),
      CategoryItem(name: 'Livraison', emoji: '🛵'),
    ],
  ),
  CategorySection(
    title: 'Transport',
    emoji: '🚗',
    items: [
      CategoryItem(name: 'Voiture', emoji: '🚗'),
      CategoryItem(name: 'Transports en commun', emoji: '🚆'),
      CategoryItem(name: 'Taxi', emoji: '🚕'),
      CategoryItem(name: 'Carburant', emoji: '⛽'),
    ],
  ),
  CategorySection(
    title: 'Logement',
    emoji: '🏠',
    items: [
      CategoryItem(name: 'Loyer', emoji: '🏠'),
      CategoryItem(name: 'Crédit immobilier', emoji: '🏡'),
      CategoryItem(name: 'Charges', emoji: '💡'),
      CategoryItem(name: 'Internet', emoji: '📡'),
      CategoryItem(name: 'Réparations', emoji: '🔧'),
      CategoryItem(name: 'Meubles', emoji: '🛋️'),
    ],
  ),
  CategorySection(
    title: 'Shopping',
    emoji: '🛍️',
    items: [
      CategoryItem(name: 'Vêtements', emoji: '👕'),
      CategoryItem(name: 'Électronique', emoji: '💻'),
      CategoryItem(name: 'Soins personnels', emoji: '🧴'),
    ],
  ),
  CategorySection(
    title: 'Loisirs',
    emoji: '🎮',
    items: [
      CategoryItem(name: 'Abonnements', emoji: '📺'),
      CategoryItem(name: 'Cinéma', emoji: '🎬'),
      CategoryItem(name: 'Jeux vidéo', emoji: '🎮'),
      CategoryItem(name: 'Loisirs', emoji: '🎨'),
    ],
  ),
  CategorySection(
    title: 'Santé',
    emoji: '🏥',
    items: [
      CategoryItem(name: 'Médecin', emoji: '🩺'),
      CategoryItem(name: 'Médicaments', emoji: '💊'),
      CategoryItem(name: 'Salle de sport', emoji: '🏋️'),
      CategoryItem(name: 'Assurance', emoji: '🛡️'),
    ],
  ),
  CategorySection(
    title: 'Éducation',
    emoji: '🎓',
    items: [
      CategoryItem(name: 'Cours', emoji: '📚'),
      CategoryItem(name: 'Livres', emoji: '📖'),
      CategoryItem(name: 'Frais de scolarité', emoji: '🎓'),
    ],
  ),
  CategorySection(
    title: 'Voyages',
    emoji: '✈️',
    items: [
      CategoryItem(name: 'Hôtels', emoji: '🏨'),
      CategoryItem(name: 'Vols', emoji: '✈️'),
      CategoryItem(name: 'Location de voiture', emoji: '🚙'),
    ],
  ),
  CategorySection(
    title: 'Autres',
    emoji: '📦',
    items: [
      CategoryItem(name: 'Dons caritatifs', emoji: '💖'),
      CategoryItem(name: 'Cadeaux', emoji: '🎁'),
      CategoryItem(name: 'Animaux', emoji: '🐾'),
      CategoryItem(name: 'Autres', emoji: '📦'),
    ],
  ),
];

const List<String> chartColors = [
  '#34d399',
  '#60a5fa',
  '#f472b6',
  '#fbbf24',
  '#a78bfa',
  '#fb923c',
  '#2dd4bf',
  '#e879f9',
];

const String storageKey = 'equilibra_data';
const String groupId = 'equilibra-fixed-group';
const String defaultCurrency = 'MAD';
