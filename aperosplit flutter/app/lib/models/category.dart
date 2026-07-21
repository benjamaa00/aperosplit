class GroupCategory {
  final String id;
  final String? groupId;
  final String name;
  final String emoji;
  final String? icon;
  final String? color;
  final int sortOrder;
  final bool isActive;
  final bool isDefault;
  final String? createdBy;
  final List<Subcategory> subcategories;

  GroupCategory({
    required this.id,
    this.groupId,
    required this.name,
    required this.emoji,
    this.icon,
    this.color,
    this.sortOrder = 0,
    this.isActive = true,
    this.isDefault = false,
    this.createdBy,
    this.subcategories = const [],
  });

  factory GroupCategory.fromJson(Map<String, dynamic> json) {
    return GroupCategory(
      id: json['id'] as String,
      groupId: json['groupId'] as String?,
      name: json['name'] as String,
      emoji: json['emoji'] as String? ?? '📦',
      icon: json['icon'] as String?,
      color: json['color'] as String?,
      sortOrder: json['sortOrder'] as int? ?? 0,
      isActive: json['isActive'] == true,
      isDefault: json['isDefault'] == true,
      createdBy: json['createdBy'] as String?,
      subcategories: (json['subcategories'] as List<dynamic>?)
              ?.map((e) => Subcategory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'groupId': groupId,
        'name': name,
        'emoji': emoji,
        'icon': icon,
        'color': color,
        'sortOrder': sortOrder,
        'isActive': isActive,
        'isDefault': isDefault,
        'createdBy': createdBy,
        'subcategories': subcategories.map((e) => e.toJson()).toList(),
      };
}

class Subcategory {
  final String id;
  final String categoryId;
  final String name;
  final String? emoji;
  final int sortOrder;
  final bool isActive;

  Subcategory({
    required this.id,
    required this.categoryId,
    required this.name,
    this.emoji,
    this.sortOrder = 0,
    this.isActive = true,
  });

  factory Subcategory.fromJson(Map<String, dynamic> json) {
    return Subcategory(
      id: json['id'] as String,
      categoryId: json['categoryId'] as String,
      name: json['name'] as String,
      emoji: json['emoji'] as String?,
      sortOrder: json['sortOrder'] as int? ?? 0,
      isActive: json['isActive'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'categoryId': categoryId,
        'name': name,
        'emoji': emoji,
        'sortOrder': sortOrder,
        'isActive': isActive,
      };
}
