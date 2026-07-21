import 'dart:convert';
import 'package:postgres/postgres.dart';
import 'package:uuid/uuid.dart';

class DatabaseService {
  static DatabaseService? _instance;
  static DatabaseService get instance => _instance ??= DatabaseService._();
  DatabaseService._();

  PostgreSQLConnection? _connection;
  final _uuid = const Uuid();
  final Map<String, dynamic> _jsonFallback = {};

  bool get isConnected => _connection != null;

  Future<void> initialize() async {
    try {
      final databaseUrl = const String.fromEnvironment(
        'DATABASE_URL',
        defaultValue: '',
      );

      if (databaseUrl.isNotEmpty) {
        final uri = Uri.parse(databaseUrl);
        _connection = PostgreSQLConnection(
          uri.host,
          uri.port,
          uri.path.substring(1),
          username: uri.userInfo.split(':').first,
          password: uri.userInfo.split(':').last,
        );
        await _connection!.open();
        print('✅ Connected to PostgreSQL');
        await _createTables();
      } else {
        print('⚠️ No DATABASE_URL found, using JSON fallback');
      }
    } catch (e) {
      print('❌ Database connection failed: $e');
      print('📦 Using JSON file fallback');
    }
  }

  Future<void> _createTables() async {
    if (_connection == null) return;

    await _connection!.execute('''
      CREATE TABLE IF NOT EXISTS groups (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        share_url TEXT,
        pin VARCHAR(10),
        approval_required BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(64) PRIMARY KEY,
        group_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar VARCHAR(10) NOT NULL,
        role VARCHAR(20) DEFAULT 'member',
        status VARCHAR(20) DEFAULT 'active',
        user_id VARCHAR(64),
        credential_id TEXT,
        biometric_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(64) PRIMARY KEY,
        group_id VARCHAR(64) NOT NULL,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(64) NOT NULL DEFAULT 'Autres',
        category_emoji VARCHAR(10) DEFAULT '📦',
        payer_id VARCHAR(64) NOT NULL,
        participants JSONB NOT NULL DEFAULT '[]',
        photo_url TEXT,
        date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(64) PRIMARY KEY,
        group_id VARCHAR(64) NOT NULL,
        from_id VARCHAR(64) NOT NULL,
        from_name VARCHAR(255) NOT NULL,
        to_id VARCHAR(64) NOT NULL,
        to_name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        original_amount DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending',
        response VARCHAR(20),
        expense_id VARCHAR(64),
        comment TEXT,
        attempt_count INT DEFAULT 0,
        notification_sent BOOLEAN DEFAULT FALSE,
        notification_count INT DEFAULT 0,
        request_note TEXT,
        accept_note TEXT,
        paid_at TIMESTAMP,
        confirmed_at TIMESTAMP,
        dispute_note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        responded_at TIMESTAMP,
        completed_at TIMESTAMP,
        confirmed_by VARCHAR(64)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        member_id VARCHAR(64) NOT NULL,
        type VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS expense_categories (
        id VARCHAR(64) PRIMARY KEY,
        group_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        created_by VARCHAR(64)
      );

      CREATE TABLE IF NOT EXISTS expense_subcategories (
        id VARCHAR(64) PRIMARY KEY,
        category_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        emoji VARCHAR(10),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS group_invites (
        id VARCHAR(64) PRIMARY KEY,
        group_id VARCHAR(64) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        max_uses INT DEFAULT 1,
        use_count INT DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activity_history (
        id VARCHAR(64) PRIMARY KEY,
        group_id VARCHAR(64) NOT NULL,
        type VARCHAR(64) NOT NULL,
        author_id VARCHAR(64),
        description TEXT,
        amount DECIMAL(10,2),
        from_id VARCHAR(64),
        to_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      );
    ''');
  }

  // Group Data
  Future<Map<String, dynamic>> getGroupData(String groupId) async {
    if (_connection == null) {
      return _jsonFallbackGetGroupData(groupId);
    }

    final members = await _connection!.query(
      'SELECT * FROM members WHERE group_id = @groupId',
      substitutionValues: {'groupId': groupId},
    );

    final expenses = await _connection!.query(
      'SELECT * FROM expenses WHERE group_id = @groupId ORDER BY created_at DESC',
      substitutionValues: {'groupId': groupId},
    );

    final payments = await _connection!.query(
      'SELECT * FROM payments WHERE group_id = @groupId ORDER BY created_at DESC',
      substitutionValues: {'groupId': groupId},
    );

    final history = await _connection!.query(
      'SELECT * FROM activity_history WHERE group_id = @groupId ORDER BY created_at DESC LIMIT 50',
      substitutionValues: {'groupId': groupId},
    );

    final categories = await _connection!.query(
      'SELECT * FROM expense_categories WHERE group_id = @groupId ORDER BY sort_order',
      substitutionValues: {'groupId': groupId},
    );

    return {
      'groupId': groupId,
      'groupName': 'Equilibra',
      'members': members.map((r) => r.toColumnMap()).toList(),
      'expenses': expenses.map((r) => r.toColumnMap()).toList(),
      'pendingPayments': payments
          .where((r) => r.toColumnMap()['status'] == 'pending')
          .map((r) => r.toColumnMap())
          .toList(),
      'completedPayments': payments
          .where((r) => r.toColumnMap()['status'] != 'pending')
          .map((r) => r.toColumnMap())
          .toList(),
      'history': history.map((r) => r.toColumnMap()).toList(),
      'categories': categories.map((r) => r.toColumnMap()).toList(),
    };
  }

  // Members
  Future<Map<String, dynamic>> createMember({
    required String groupId,
    required String name,
    required String avatar,
    String role = 'member',
    String status = 'active',
  }) async {
    final id = _uuid.v4();

    if (_connection != null) {
      await _connection!.execute(
        '''INSERT INTO members (id, group_id, name, avatar, role, status) VALUES (@id, @groupId, @name, @avatar, @role, @status)''',
        substitutionValues: {
          'id': id,
          'groupId': groupId,
          'name': name,
          'avatar': avatar,
          'role': role,
          'status': status,
        },
      );
    }

    return {
      'id': id,
      'groupId': groupId,
      'name': name,
      'avatar': avatar,
      'role': role,
      'status': status,
    };
  }

  Future<void> updateMember(String memberId, {String? name, String? avatar}) async {
    if (_connection == null) return;
    if (name != null) {
      await _connection!.execute(
        'UPDATE members SET name = @name WHERE id = @id',
        substitutionValues: {'name': name, 'id': memberId},
      );
    }
    if (avatar != null) {
      await _connection!.execute(
        'UPDATE members SET avatar = @avatar WHERE id = @id',
        substitutionValues: {'avatar': avatar, 'id': memberId},
      );
    }
  }

  Future<void> updateMemberStatus(String memberId, String status) async {
    if (_connection == null) return;
    await _connection!.execute(
      'UPDATE members SET status = @status WHERE id = @id',
      substitutionValues: {'status': status, 'id': memberId},
    );
  }

  Future<void> updateMemberRole(String memberId, String role) async {
    if (_connection == null) return;
    await _connection!.execute(
      'UPDATE members SET role = @role WHERE id = @id',
      substitutionValues: {'role': role, 'id': memberId},
    );
  }

  Future<void> deleteMember(String memberId) async {
    if (_connection == null) return;
    await _connection!.execute(
      'DELETE FROM members WHERE id = @id',
      substitutionValues: {'id': memberId},
    );
  }

  // Expenses
  Future<Map<String, dynamic>> createExpense({
    required String groupId,
    required String description,
    required double amount,
    required String payerId,
    required String category,
    required String categoryEmoji,
    required List<String> participants,
    String? photoUrl,
  }) async {
    final id = _uuid.v4();

    if (_connection != null) {
      await _connection!.execute(
        '''INSERT INTO expenses (id, group_id, description, amount, category, category_emoji, payer_id, participants, photo_url)
           VALUES (@id, @groupId, @description, @amount, @category, @categoryEmoji, @payerId, @participants, @photoUrl)''',
        substitutionValues: {
          'id': id,
          'groupId': groupId,
          'description': description,
          'amount': amount,
          'category': category,
          'categoryEmoji': categoryEmoji,
          'payerId': payerId,
          'participants': json.encode(participants),
          'photoUrl': photoUrl,
        },
      );
    }

    return {
      'id': id,
      'groupId': groupId,
      'description': description,
      'amount': amount,
      'category': category,
      'categoryEmoji': categoryEmoji,
      'payerId': payerId,
      'participants': participants,
      'photoUrl': photoUrl,
    };
  }

  Future<void> deleteExpense(String expenseId) async {
    if (_connection == null) return;
    await _connection!.execute(
      'DELETE FROM expenses WHERE id = @id',
      substitutionValues: {'id': expenseId},
    );
  }

  // Payments
  Future<Map<String, dynamic>> createPayment({
    required String groupId,
    required String fromId,
    required String fromName,
    required String toId,
    required String toName,
    required double amount,
    String? expenseId,
    String? note,
  }) async {
    final id = _uuid.v4();

    if (_connection != null) {
      await _connection!.execute(
        '''INSERT INTO payments (id, group_id, from_id, from_name, to_id, to_name, amount, expense_id, request_note)
           VALUES (@id, @groupId, @fromId, @fromName, @toId, @toName, @amount, @expenseId, @requestNote)''',
        substitutionValues: {
          'id': id,
          'groupId': groupId,
          'fromId': fromId,
          'fromName': fromName,
          'toId': toId,
          'toName': toName,
          'amount': amount,
          'expenseId': expenseId,
          'requestNote': note,
        },
      );
    }

    return {
      'id': id,
      'groupId': groupId,
      'fromId': fromId,
      'fromName': fromName,
      'toId': toId,
      'toName': toName,
      'amount': amount,
      'status': 'pending',
      'expenseId': expenseId,
      'requestNote': note,
    };
  }

  Future<void> updatePaymentStatus(String paymentId, String status) async {
    if (_connection == null) return;
    await _connection!.execute(
      'UPDATE payments SET status = @status WHERE id = @id',
      substitutionValues: {'status': status, 'id': paymentId},
    );
  }

  Future<void> deletePayment(String paymentId) async {
    if (_connection == null) return;
    await _connection!.execute(
      'DELETE FROM payments WHERE id = @id',
      substitutionValues: {'id': paymentId},
    );
  }

  Future<void> incrementPaymentAttempt(String paymentId) async {
    if (_connection == null) return;
    await _connection!.execute(
      'UPDATE payments SET attempt_count = attempt_count + 1, status = \'resent\' WHERE id = @id',
      substitutionValues: {'id': paymentId},
    );
  }

  // Notifications
  Future<List<Map<String, dynamic>>> getNotifications(String memberId) async {
    if (_connection == null) return [];
    final results = await _connection!.query(
      'SELECT * FROM notifications WHERE member_id = @memberId ORDER BY created_at DESC LIMIT 50',
      substitutionValues: {'memberId': memberId},
    );
    return results.map((r) => r.toColumnMap()).toList();
  }

  Future<void> markNotificationRead(String notificationId) async {
    if (_connection == null) return;
    await _connection!.execute(
      'UPDATE notifications SET read = TRUE WHERE id = @id',
      substitutionValues: {'id': notificationId},
    );
  }

  Future<void> markAllNotificationsRead(String memberId) async {
    if (_connection == null) return;
    await _connection!.execute(
      'UPDATE notifications SET read = TRUE WHERE member_id = @memberId',
      substitutionValues: {'memberId': memberId},
    );
  }

  // Categories
  Future<List<Map<String, dynamic>>> getCategories(String groupId) async {
    if (_connection == null) return _defaultCategories();
    final results = await _connection!.query(
      'SELECT * FROM expense_categories WHERE group_id = @groupId ORDER BY sort_order',
      substitutionValues: {'groupId': groupId},
    );
    final categories = results.map((r) => r.toColumnMap()).toList();

    for (final category in categories) {
      final subcats = await _connection!.query(
        'SELECT * FROM expense_subcategories WHERE category_id = @categoryId ORDER BY sort_order',
        substitutionValues: {'categoryId': category['id']},
      );
      category['subcategories'] = subcats.map((r) => r.toColumnMap()).toList();
    }

    return categories;
  }

  Future<Map<String, dynamic>> createCategory({
    required String groupId,
    required String name,
    required String emoji,
  }) async {
    final id = _uuid.v4();

    if (_connection != null) {
      await _connection!.execute(
        '''INSERT INTO expense_categories (id, group_id, name, emoji)
           VALUES (@id, @groupId, @name, @emoji)''',
        substitutionValues: {
          'id': id,
          'groupId': groupId,
          'name': name,
          'emoji': emoji,
        },
      );
    }

    return {
      'id': id,
      'groupId': groupId,
      'name': name,
      'emoji': emoji,
      'isActive': true,
      'isDefault': false,
      'subcategories': [],
    };
  }

  Future<void> deleteCategory(String categoryId) async {
    if (_connection == null) return;
    await _connection!.execute(
      'DELETE FROM expense_categories WHERE id = @id',
      substitutionValues: {'id': categoryId},
    );
  }

  // Invites
  Future<Map<String, dynamic>> createInvite({
    required String groupId,
    required String token,
  }) async {
    final id = _uuid.v4();

    if (_connection != null) {
      await _connection!.execute(
        '''INSERT INTO group_invites (id, group_id, token)
           VALUES (@id, @groupId, @token)''',
        substitutionValues: {
          'id': id,
          'groupId': groupId,
          'token': token,
        },
      );
    }

    return {
      'id': id,
      'groupId': groupId,
      'token': token,
      'maxUses': 1,
      'useCount': 0,
    };
  }

  Future<bool> validateInvite(String token) async {
    if (_connection == null) return true;
    final results = await _connection!.query(
      'SELECT * FROM group_invites WHERE token = @token AND use_count < max_uses',
      substitutionValues: {'token': token},
    );
    if (results.isNotEmpty) {
      await _connection!.execute(
        'UPDATE group_invites SET use_count = use_count + 1 WHERE token = @token',
        substitutionValues: {'token': token},
      );
      return true;
    }
    return false;
  }

  // Stats
  Future<Map<String, dynamic>> getGroupStats(String groupId) async {
    if (_connection == null) return {};

    final totalResult = await _connection!.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE group_id = @groupId',
      substitutionValues: {'groupId': groupId},
    );

    final countResult = await _connection!.query(
      'SELECT COUNT(*) as count FROM expenses WHERE group_id = @groupId',
      substitutionValues: {'groupId': groupId},
    );

    final categoryResult = await _connection!.query(
      'SELECT category, SUM(amount) as total FROM expenses WHERE group_id = @groupId GROUP BY category ORDER BY total DESC',
      substitutionValues: {'groupId': groupId},
    );

    return {
      'totalSpent': totalResult.first.toColumnMap()['total'],
      'expenseCount': countResult.first.toColumnMap()['count'],
      'byCategory': categoryResult.map((r) => r.toColumnMap()).toList(),
    };
  }

  // CSV Export
  Future<String> exportCSV(String groupId) async {
    if (_connection == null) return '';

    final expenses = await _connection!.query(
      'SELECT * FROM expenses WHERE group_id = @groupId ORDER BY created_at DESC',
      substitutionValues: {'groupId': groupId},
    );

    final buffer = StringBuffer();
    buffer.writeln('Date,Description,Montant,Catégorie,Payé par');

    for (final row in expenses) {
      final data = row.toColumnMap();
      buffer.writeln(
        '${data['created_at']},${data['description']},${data['amount']},${data['category']},${data['payer_id']}',
      );
    }

    return buffer.toString();
  }

  // Group settings
  Future<void> updateGroup(
    String groupId, {
    String? name,
    String? pin,
    bool? approvalRequired,
  }) async {
    if (_connection == null) return;
    if (name != null) {
      await _connection!.execute(
        'UPDATE groups SET name = @name WHERE id = @id',
        substitutionValues: {'name': name, 'id': groupId},
      );
    }
    if (pin != null) {
      await _connection!.execute(
        'UPDATE groups SET pin = @pin WHERE id = @id',
        substitutionValues: {'pin': pin, 'id': groupId},
      );
    }
    if (approvalRequired != null) {
      await _connection!.execute(
        'UPDATE groups SET approval_required = @approval WHERE id = @id',
        substitutionValues: {'approval': approvalRequired, 'id': groupId},
      );
    }
  }

  // JSON Fallback
  Map<String, dynamic> _jsonFallbackGetGroupData(String groupId) {
    return _jsonFallback[groupId] ?? {
      'groupId': groupId,
      'groupName': 'Equilibra',
      'members': [],
      'expenses': [],
      'pendingPayments': [],
      'completedPayments': [],
      'history': [],
      'categories': _defaultCategories(),
    };
  }

  List<Map<String, dynamic>> _defaultCategories() {
    return [
      {'id': 'cat-1', 'name': 'Courses', 'emoji': '🛒', 'isActive': true, 'isDefault': true, 'subcategories': []},
      {'id': 'cat-2', 'name': 'Restaurants', 'emoji': '🍽️', 'isActive': true, 'isDefault': true, 'subcategories': []},
      {'id': 'cat-3', 'name': 'Transport', 'emoji': '🚗', 'isActive': true, 'isDefault': true, 'subcategories': []},
      {'id': 'cat-4', 'name': 'Logement', 'emoji': '🏠', 'isActive': true, 'isDefault': true, 'subcategories': []},
      {'id': 'cat-5', 'name': 'Shopping', 'emoji': '🛍️', 'isActive': true, 'isDefault': true, 'subcategories': []},
      {'id': 'cat-6', 'name': 'Loisirs', 'emoji': '🎮', 'isActive': true, 'isDefault': true, 'subcategories': []},
      {'id': 'cat-7', 'name': 'Santé', 'emoji': '🏥', 'isActive': true, 'isDefault': true, 'subcategories': []},
      {'id': 'cat-8', 'name': 'Éducation', 'emoji': '🎓', 'isActive': true, 'isDefault': true, 'subcategories': []},
      {'id': 'cat-9', 'name': 'Voyages', 'emoji': '✈️', 'isActive': true, 'isDefault': true, 'subcategories': []},
      {'id': 'cat-10', 'name': 'Autres', 'emoji': '📦', 'isActive': true, 'isDefault': true, 'subcategories': []},
    ];
  }
}
