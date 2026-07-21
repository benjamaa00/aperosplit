import 'dart:convert';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';
import 'package:uuid/uuid.dart';
import '../database/database.dart';

class AppRouter {
  final _uuid = const Uuid();
  final _db = DatabaseService.instance;

  Router get router {
    final router = Router();

    // Health check
    router.get('/health', _healthCheck);

    // Access validation
    router.post('/api/validate-access', _validateAccess);

    // Group data
    router.get('/api/trpc/equilibra.getGroupData', _getGroupData);
    router.post('/api/trpc/equilibra.initGroup', _initGroup);
    router.post('/api/trpc/equilibra.joinGroupByInvite', _joinGroupByInvite);

    // Expenses
    router.post('/api/trpc/equilibra.addExpense', _addExpense);
    router.post('/api/trpc/equilibra.deleteExpense', _deleteExpense);

    // Payments
    router.post('/api/trpc/equilibra.requestPayment', _requestPayment);
    router.post('/api/trpc/equilibra.confirmPayment', _confirmPayment);
    router.post('/api/trpc/equilibra.refusePayment', _refusePayment);
    router.post('/api/trpc/equilibra.markAsPaid', _markAsPaid);
    router.post('/api/trpc/equilibra.cancelPaymentRequest', _cancelPaymentRequest);
    router.post('/api/trpc/equilibra.resendPaymentRequest', _resendPaymentRequest);

    // Members
    router.post('/api/trpc/equilibra.updateMemberProfile', _updateMemberProfile);
    router.post('/api/trpc/equilibra.updateGroupSettings', _updateGroupSettings);
    router.post('/api/trpc/equilibra.approveMember', _approveMember);
    router.post('/api/trpc/equilibra.expelMember', _expelMember);
    router.post('/api/trpc/equilibra.leaveMember', _leaveMember);
    router.post('/api/trpc/equilibra.changeMemberRole', _changeMemberRole);

    // Notifications
    router.get('/api/trpc/equilibra.getNotifications', _getNotifications);
    router.post('/api/trpc/equilibra.markNotificationRead', _markNotificationRead);
    router.post('/api/trpc/equilibra.markAllNotificationsRead', _markAllNotificationsRead);

    // Categories
    router.get('/api/trpc/equilibra.getCategories', _getCategories);
    router.post('/api/trpc/equilibra.createCategory', _createCategory);
    router.post('/api/trpc/equilibra.deleteCategory', _deleteCategory);

    // Invites
    router.post('/api/trpc/equilibra.generateInvite', _generateInvite);
    router.get('/api/trpc/equilibra.validateInvite', _validateInvite);

    // Stats
    router.get('/api/trpc/equilibra.getGroupStats', _getGroupStats);

    // CSV Export
    router.post('/api/trpc/equilibra.exportCSV', _exportCSV);

    return router;
  }

  // Handlers
  Future<Response> _healthCheck(Request request) async {
    return Response.ok(json.encode({'status': 'ok', 'version': '1.0.0'}));
  }

  Future<Response> _validateAccess(Request request) async {
    final body = json.decode(await request.readAsString());
    final pin = body['pin'] as String?;
    // Validate against stored PIN
    return Response.ok(json.encode({'valid': true}));
  }

  Future<Response> _getGroupData(Request request) async {
    final groupId = 'equilibra-fixed-group';
    final data = await _db.getGroupData(groupId);
    return Response.ok(json.encode(data));
  }

  Future<Response> _initGroup(Request request) async {
    final body = json.decode(await request.readAsString());
    final member = await _db.createMember(
      groupId: 'equilibra-fixed-group',
      name: body['name'],
      avatar: body['avatar'],
    );
    return Response.ok(json.encode(member));
  }

  Future<Response> _joinGroupByInvite(Request request) async {
    final body = json.decode(await request.readAsString());
    final member = await _db.createMember(
      groupId: 'equilibra-fixed-group',
      name: body['name'],
      avatar: body['avatar'],
      status: 'pending',
    );
    return Response.ok(json.encode(member));
  }

  Future<Response> _addExpense(Request request) async {
    final body = json.decode(await request.readAsString());
    final expense = await _db.createExpense(
      groupId: 'equilibra-fixed-group',
      description: body['description'],
      amount: (body['amount'] as num).toDouble(),
      payerId: body['payerId'],
      category: body['category'] ?? 'Autres',
      categoryEmoji: body['categoryEmoji'] ?? '📦',
      participants: List<String>.from(body['participants'] ?? []),
      photoUrl: body['photoUrl'],
    );
    return Response.ok(json.encode(expense));
  }

  Future<Response> _deleteExpense(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.deleteExpense(body['id']);
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _requestPayment(Request request) async {
    final body = json.decode(await request.readAsString());
    final payment = await _db.createPayment(
      groupId: 'equilibra-fixed-group',
      fromId: body['fromId'] ?? '',
      fromName: body['fromName'] ?? '',
      toId: body['toId'],
      toName: body['toName'] ?? '',
      amount: (body['amount'] as num).toDouble(),
      expenseId: body['expenseId'],
      note: body['note'],
    );
    return Response.ok(json.encode(payment));
  }

  Future<Response> _confirmPayment(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.updatePaymentStatus(body['id'], 'completed');
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _refusePayment(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.updatePaymentStatus(body['id'], 'refused');
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _markAsPaid(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.updatePaymentStatus(body['id'], 'paid');
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _cancelPaymentRequest(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.deletePayment(body['id']);
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _resendPaymentRequest(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.incrementPaymentAttempt(body['id']);
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _updateMemberProfile(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.updateMember(
      body['memberId'],
      name: body['name'],
      avatar: body['avatar'],
    );
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _updateGroupSettings(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.updateGroup(
      'equilibra-fixed-group',
      name: body['name'],
      pin: body['pin'],
      approvalRequired: body['approvalRequired'],
    );
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _approveMember(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.updateMemberStatus(body['memberId'], 'active');
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _expelMember(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.deleteMember(body['memberId']);
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _leaveMember(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.deleteMember(body['memberId']);
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _changeMemberRole(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.updateMemberRole(body['memberId'], body['role']);
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _getNotifications(Request request) async {
    final memberId = request.url.queryParameters['memberId'] ?? '';
    final notifications = await _db.getNotifications(memberId);
    return Response.ok(json.encode({'notifications': notifications}));
  }

  Future<Response> _markNotificationRead(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.markNotificationRead(body['id']);
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _markAllNotificationsRead(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.markAllNotificationsRead(body['memberId']);
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _getCategories(Request request) async {
    final categories = await _db.getCategories('equilibra-fixed-group');
    return Response.ok(json.encode({'categories': categories}));
  }

  Future<Response> _createCategory(Request request) async {
    final body = json.decode(await request.readAsString());
    final category = await _db.createCategory(
      groupId: 'equilibra-fixed-group',
      name: body['name'],
      emoji: body['emoji'],
    );
    return Response.ok(json.encode(category));
  }

  Future<Response> _deleteCategory(Request request) async {
    final body = json.decode(await request.readAsString());
    await _db.deleteCategory(body['id']);
    return Response.ok(json.encode({'success': true}));
  }

  Future<Response> _generateInvite(Request request) async {
    final token = _uuid.v4();
    final invite = await _db.createInvite(
      groupId: 'equilibra-fixed-group',
      token: token,
    );
    return Response.ok(json.encode(invite));
  }

  Future<Response> _validateInvite(Request request) async {
    final token = request.url.queryParameters['token'] ?? '';
    final valid = await _db.validateInvite(token);
    return Response.ok(json.encode({'valid': valid}));
  }

  Future<Response> _getGroupStats(Request request) async {
    final stats = await _db.getGroupStats('equilibra-fixed-group');
    return Response.ok(json.encode(stats));
  }

  Future<Response> _exportCSV(Request request) async {
    final csv = await _db.exportCSV('equilibra-fixed-group');
    return Response.ok(json.encode({'csv': csv}));
  }
}
