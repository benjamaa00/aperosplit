enum PaymentStatus {
  pending,
  accepted,
  refused,
  resent,
  inProgress,
  completed,
  late,
  disputed,
  paid;

  factory PaymentStatus.fromString(String value) {
    return PaymentStatus.values.firstWhere(
      (e) => e.name == value.replaceAll('-', '_'),
      orElse: () => PaymentStatus.pending,
    );
  }

  String get displayName {
    switch (this) {
      case PaymentStatus.pending:
        return 'En attente';
      case PaymentStatus.accepted:
        return 'Accepté';
      case PaymentStatus.refused:
        return 'Refusé';
      case PaymentStatus.resent:
        return 'Relancé';
      case PaymentStatus.inProgress:
        return 'En cours';
      case PaymentStatus.completed:
        return 'Terminé';
      case PaymentStatus.late:
        return 'En retard';
      case PaymentStatus.disputed:
        return 'Litigé';
      case PaymentStatus.paid:
        return 'Payé';
    }
  }
}

class PaymentRequest {
  final String id;
  final String fromId;
  final String fromName;
  final String toId;
  final String toName;
  final double amount;
  final double? originalAmount;
  final PaymentStatus status;
  final String? response;
  final String? expenseId;
  final DateTime createdAt;
  final DateTime? respondedAt;
  final DateTime? completedAt;
  final String? confirmedBy;
  final String? comment;
  final int attemptCount;
  final bool notificationSent;
  final int notificationCount;
  final String? requestNote;
  final String? acceptNote;
  final DateTime? paidAt;
  final DateTime? confirmedAt;
  final String? disputeNote;

  PaymentRequest({
    required this.id,
    required this.fromId,
    required this.fromName,
    required this.toId,
    required this.toName,
    required this.amount,
    this.originalAmount,
    this.status = PaymentStatus.pending,
    this.response,
    this.expenseId,
    required this.createdAt,
    this.respondedAt,
    this.completedAt,
    this.confirmedBy,
    this.comment,
    this.attemptCount = 0,
    this.notificationSent = false,
    this.notificationCount = 0,
    this.requestNote,
    this.acceptNote,
    this.paidAt,
    this.confirmedAt,
    this.disputeNote,
  });

  factory PaymentRequest.fromJson(Map<String, dynamic> json) {
    return PaymentRequest(
      id: json['id'] as String,
      fromId: json['fromId'] as String,
      fromName: json['fromName'] as String,
      toId: json['toId'] as String,
      toName: json['toName'] as String,
      amount: (json['amount'] as num).toDouble(),
      originalAmount: json['originalAmount'] != null
          ? (json['originalAmount'] as num).toDouble()
          : null,
      status: PaymentStatus.fromString(json['status'] as String? ?? 'pending'),
      response: json['response'] as String?,
      expenseId: json['expenseId'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
      respondedAt: json['respondedAt'] != null
          ? DateTime.parse(json['respondedAt'].toString())
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'].toString())
          : null,
      confirmedBy: json['confirmedBy'] as String?,
      comment: json['comment'] as String?,
      attemptCount: json['attemptCount'] as int? ?? 0,
      notificationSent: json['notificationSent'] == true,
      notificationCount: json['notificationCount'] as int? ?? 0,
      requestNote: json['requestNote'] as String?,
      acceptNote: json['acceptNote'] as String?,
      paidAt: json['paidAt'] != null ? DateTime.parse(json['paidAt'].toString()) : null,
      confirmedAt: json['confirmedAt'] != null ? DateTime.parse(json['confirmedAt'].toString()) : null,
      disputeNote: json['disputeNote'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'fromId': fromId,
        'fromName': fromName,
        'toId': toId,
        'toName': toName,
        'amount': amount,
        'originalAmount': originalAmount,
        'status': status.name,
        'response': response,
        'expenseId': expenseId,
        'createdAt': createdAt.toIso8601String(),
        'attemptCount': attemptCount,
        'notificationSent': notificationSent,
        'notificationCount': notificationCount,
        'requestNote': requestNote,
        'acceptNote': acceptNote,
        'disputeNote': disputeNote,
      };
}
