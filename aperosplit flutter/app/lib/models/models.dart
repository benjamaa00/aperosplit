import 'member.dart';
import 'expense.dart';
import 'payment_request.dart';
import 'category.dart';

export 'member.dart';
export 'expense.dart';
export 'payment_request.dart';
export 'category.dart';

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final bool read;
  final Map<String, dynamic>? data;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.read = false,
    this.data,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      read: json['read'] == true,
      data: json['data'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'title': title,
        'message': message,
        'read': read,
        'data': data,
        'createdAt': createdAt.toIso8601String(),
      };
}

class PaymentComment {
  final String id;
  final String paymentId;
  final String authorId;
  final String authorName;
  final String message;
  final DateTime createdAt;

  PaymentComment({
    required this.id,
    required this.paymentId,
    required this.authorId,
    required this.authorName,
    required this.message,
    required this.createdAt,
  });

  factory PaymentComment.fromJson(Map<String, dynamic> json) {
    return PaymentComment(
      id: json['id'] as String,
      paymentId: json['paymentId'] as String,
      authorId: json['authorId'] as String,
      authorName: json['authorName'] as String,
      message: json['message'] as String,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }
}

class ActivityHistory {
  final String id;
  final String type;
  final String? authorId;
  final String? description;
  final double? amount;
  final String? fromId;
  final String? toId;
  final DateTime createdAt;

  ActivityHistory({
    required this.id,
    required this.type,
    this.authorId,
    this.description,
    this.amount,
    this.fromId,
    this.toId,
    required this.createdAt,
  });

  factory ActivityHistory.fromJson(Map<String, dynamic> json) {
    return ActivityHistory(
      id: json['id'] as String,
      type: json['type'] as String,
      authorId: json['authorId'] as String?,
      description: json['description'] as String?,
      amount: json['amount'] != null ? (json['amount'] as num).toDouble() : null,
      fromId: json['fromId'] as String?,
      toId: json['toId'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }
}

class GroupData {
  final String groupId;
  final String groupName;
  final List<Member> members;
  final List<Expense> expenses;
  final List<PaymentRequest> pendingPayments;
  final List<PaymentRequest> completedPayments;
  final List<ActivityHistory> history;
  final List<GroupCategory> categories;

  GroupData({
    required this.groupId,
    required this.groupName,
    required this.members,
    required this.expenses,
    required this.pendingPayments,
    required this.completedPayments,
    required this.history,
    required this.categories,
  });

  factory GroupData.fromJson(Map<String, dynamic> json) {
    return GroupData(
      groupId: json['groupId'] as String? ?? '',
      groupName: json['groupName'] as String? ?? 'Equilibra',
      members: (json['members'] as List<dynamic>?)
              ?.map((e) => Member.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      expenses: (json['expenses'] as List<dynamic>?)
              ?.map((e) => Expense.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      pendingPayments: (json['pendingPayments'] as List<dynamic>?)
              ?.map((e) => PaymentRequest.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      completedPayments: (json['completedPayments'] as List<dynamic>?)
              ?.map((e) => PaymentRequest.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      history: (json['history'] as List<dynamic>?)
              ?.map((e) => ActivityHistory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      categories: (json['categories'] as List<dynamic>?)
              ?.map((e) => GroupCategory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
