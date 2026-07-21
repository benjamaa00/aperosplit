class Expense {
  final String id;
  final String description;
  final double amount;
  final String payerId;
  final String category;
  final String categoryEmoji;
  final DateTime date;
  final List<String> participants;
  final String? photoUrl;
  final String? status;
  final bool isRecurring;
  final String? recurrenceInterval;
  final DateTime createdAt;

  Expense({
    required this.id,
    required this.description,
    required this.amount,
    required this.payerId,
    required this.category,
    required this.categoryEmoji,
    required this.date,
    required this.participants,
    this.photoUrl,
    this.status,
    this.isRecurring = false,
    this.recurrenceInterval,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id'] as String,
      description: json['description'] as String,
      amount: (json['amount'] as num).toDouble(),
      payerId: json['payerId'] as String,
      category: json['category'] as String? ?? 'Autres',
      categoryEmoji: json['categoryEmoji'] as String? ?? '📦',
      date: json['date'] != null ? DateTime.parse(json['date'].toString()) : DateTime.now(),
      participants: (json['participants'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      photoUrl: json['photoUrl'] as String?,
      status: json['status'] as String?,
      isRecurring: json['isRecurring'] == true,
      recurrenceInterval: json['recurrenceInterval'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'description': description,
        'amount': amount,
        'payerId': payerId,
        'category': category,
        'categoryEmoji': categoryEmoji,
        'date': date.toIso8601String(),
        'participants': participants,
        'photoUrl': photoUrl,
        'status': status,
        'isRecurring': isRecurring,
        'recurrenceInterval': recurrenceInterval,
        'createdAt': createdAt.toIso8601String(),
      };

  Expense copyWith({
    String? description,
    double? amount,
    String? payerId,
    String? category,
    String? categoryEmoji,
    DateTime? date,
    List<String>? participants,
    String? photoUrl,
  }) {
    return Expense(
      id: id,
      description: description ?? this.description,
      amount: amount ?? this.amount,
      payerId: payerId ?? this.payerId,
      category: category ?? this.category,
      categoryEmoji: categoryEmoji ?? this.categoryEmoji,
      date: date ?? this.date,
      participants: participants ?? this.participants,
      photoUrl: photoUrl ?? this.photoUrl,
      status: status,
      isRecurring: isRecurring,
      recurrenceInterval: recurrenceInterval,
      createdAt: createdAt,
    );
  }
}
