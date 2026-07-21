import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class ApiService {
  final String baseUrl;
  String? _accessKey;

  ApiService({required this.baseUrl});

  void setAccessKey(String key) {
    _accessKey = key;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_accessKey != null) 'X-Group-Access-Key': _accessKey!,
      };

  Future<Map<String, dynamic>> _get(String path) async {
    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Erreur ${response.statusCode}: ${response.body}');
    }
    return json.decode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> _post(String path, {Map<String, dynamic>? body}) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
      body: body != null ? json.encode(body) : null,
    );
    if (response.statusCode != 200) {
      throw Exception('Erreur ${response.statusCode}: ${response.body}');
    }
    return json.decode(response.body) as Map<String, dynamic>;
  }

  // Auth
  Future<bool> validateAccessPin(String pin) async {
    try {
      final result = await _post('/api/validate-access', body: {'pin': pin});
      return result['valid'] == true;
    } catch (e) {
      return false;
    }
  }

  // Group Data
  Future<GroupData> getGroupData() async {
    final result = await _get('/api/trpc/equilibra.getGroupData');
    return GroupData.fromJson(result);
  }

  // Members
  Future<Member> registerMember(String name, String avatar) async {
    final result = await _post('/api/trpc/equilibra.initGroup', body: {
      'name': name,
      'avatar': avatar,
    });
    return Member.fromJson(result);
  }

  Future<Member> joinGroup(String name, String avatar, {String? inviteToken}) async {
    final result = await _post('/api/trpc/equilibra.joinGroupByInvite', body: {
      'name': name,
      'avatar': avatar,
      'token': inviteToken,
    });
    return Member.fromJson(result);
  }

  // Expenses
  Future<Expense> addExpense({
    required String description,
    required double amount,
    required String payerId,
    required String category,
    required String categoryEmoji,
    required List<String> participants,
    String? photoUrl,
  }) async {
    final result = await _post('/api/trpc/equilibra.addExpense', body: {
      'description': description,
      'amount': amount,
      'payerId': payerId,
      'category': category,
      'categoryEmoji': categoryEmoji,
      'participants': participants,
      'photoUrl': photoUrl,
    });
    return Expense.fromJson(result);
  }

  Future<void> deleteExpense(String id) async {
    await _post('/api/trpc/equilibra.deleteExpense', body: {'id': id});
  }

  // Payments
  Future<PaymentRequest> requestPayment({
    required String toId,
    required double amount,
    String? expenseId,
    String? note,
  }) async {
    final result = await _post('/api/trpc/equilibra.requestPayment', body: {
      'toId': toId,
      'amount': amount,
      if (expenseId != null) 'expenseId': expenseId,
      if (note != null) 'note': note,
    });
    return PaymentRequest.fromJson(result);
  }

  Future<void> confirmPayment(String id) async {
    await _post('/api/trpc/equilibra.confirmPayment', body: {'id': id});
  }

  Future<void> refusePayment(String id, {String? comment}) async {
    await _post('/api/trpc/equilibra.refusePayment', body: {
      'id': id,
      if (comment != null) 'comment': comment,
    });
  }

  Future<void> markAsPaid(String id) async {
    await _post('/api/trpc/equilibra.markAsPaid', body: {'id': id});
  }

  Future<void> cancelPaymentRequest(String id) async {
    await _post('/api/trpc/equilibra.cancelPaymentRequest', body: {'id': id});
  }

  Future<void> resendPaymentRequest(String id) async {
    await _post('/api/trpc/equilibra.resendPaymentRequest', body: {'id': id});
  }

  // Profile
  Future<void> updateMemberProfile(String memberId, {String? name, String? avatar}) async {
    await _post('/api/trpc/equilibra.updateMemberProfile', body: {
      'memberId': memberId,
      if (name != null) 'name': name,
      if (avatar != null) 'avatar': avatar,
    });
  }

  Future<void> updateGroupSettings({String? name, String? pin, bool? approvalRequired}) async {
    await _post('/api/trpc/equilibra.updateGroupSettings', body: {
      if (name != null) 'name': name,
      if (pin != null) 'pin': pin,
      if (approvalRequired != null) 'approvalRequired': approvalRequired,
    });
  }

  // Notifications
  Future<List<AppNotification>> getNotifications(String memberId) async {
    final result = await _get('/api/trpc/equilibra.getNotifications?memberId=$memberId');
    return (result['notifications'] as List<dynamic>?)
            ?.map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
  }

  Future<void> markNotificationRead(String id) async {
    await _post('/api/trpc/equilibra.markNotificationRead', body: {'id': id});
  }

  Future<void> markAllNotificationsRead(String memberId) async {
    await _post('/api/trpc/equilibra.markAllNotificationsRead', body: {
      'memberId': memberId,
    });
  }

  // Categories
  Future<List<GroupCategory>> getCategories() async {
    final result = await _get('/api/trpc/equilibra.getCategories');
    return (result['categories'] as List<dynamic>?)
            ?.map((e) => GroupCategory.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
  }

  Future<GroupCategory> createCategory(String name, String emoji) async {
    final result = await _post('/api/trpc/equilibra.createCategory', body: {
      'name': name,
      'emoji': emoji,
    });
    return GroupCategory.fromJson(result);
  }

  Future<void> deleteCategory(String id) async {
    await _post('/api/trpc/equilibra.deleteCategory', body: {'id': id});
  }

  // Invite
  Future<Map<String, dynamic>> generateInvite() async {
    final result = await _post('/api/trpc/equilibra.generateInvite');
    return result;
  }

  Future<bool> validateInvite(String token) async {
    try {
      final result = await _get('/api/trpc/equilibra.validateInvite?token=$token');
      return result['valid'] == true;
    } catch (e) {
      return false;
    }
  }

  // Stats
  Future<Map<String, dynamic>> getGroupStats() async {
    return await _get('/api/trpc/equilibra.getGroupStats');
  }

  // CSV Export
  Future<String> exportCSV() async {
    final result = await _post('/api/trpc/equilibra.exportCSV');
    return result['csv'] as String;
  }

  // Receipt Photo
  Future<String> uploadReceiptPhoto(String filePath) async {
    final result = await _post('/api/trpc/equilibra.uploadReceiptPhoto', body: {
      'filePath': filePath,
    });
    return result['url'] as String;
  }

  Future<Map<String, dynamic>> analyzeReceiptPhoto(String photoUrl) async {
    final result = await _post('/api/trpc/equilibra.analyzeReceiptPhoto', body: {
      'photoUrl': photoUrl,
    });
    return result;
  }
}
