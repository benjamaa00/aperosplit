class Member {
  final String id;
  final String name;
  final String avatar;
  final String? role;
  final String? status;
  final String? userId;
  final bool biometricEnabled;
  final DateTime createdAt;

  Member({
    required this.id,
    required this.name,
    required this.avatar,
    this.role,
    this.status,
    this.userId,
    this.biometricEnabled = false,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      id: json['id'] as String,
      name: json['name'] as String,
      avatar: json['avatar'] as String,
      role: json['role'] as String?,
      status: json['status'] as String?,
      userId: json['userId'] as String?,
      biometricEnabled: json['biometricEnabled'] == true || json['biometricEnabled'] == 'true',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'avatar': avatar,
        'role': role,
        'status': status,
        'userId': userId,
        'biometricEnabled': biometricEnabled,
        'createdAt': createdAt.toIso8601String(),
      };

  Member copyWith({
    String? name,
    String? avatar,
    String? role,
    String? status,
    bool? biometricEnabled,
  }) {
    return Member(
      id: id,
      name: name ?? this.name,
      avatar: avatar ?? this.avatar,
      role: role ?? this.role,
      status: status ?? this.status,
      userId: userId,
      biometricEnabled: biometricEnabled ?? this.biometricEnabled,
      createdAt: createdAt,
    );
  }
}
