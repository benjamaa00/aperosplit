import 'package:flutter/material.dart';
import '../utils/debts.dart';
import '../models/models.dart';

class AppState extends ChangeNotifier {
  // Core data
  String _accessKey = '';
  Member? _currentMember;
  List<Member> _members = [];
  List<Expense> _expenses = [];
  List<PaymentRequest> _pendingPayments = [];
  List<PaymentRequest> _completedPayments = [];
  List<ActivityHistory> _history = [];
  List<GroupCategory> _categories = [];
  List<AppNotification> _notifications = [];

  // Settings
  String _currency = 'MAD';
  double _monthlyBudget = 0;
  String _groupName = 'Equilibra';

  // Theme
  String _paletteName = 'Violet';
  String _gradientStyle = 'None';
  bool _isDarkMode = false;
  bool _isGlassmorphism = true;

  // Getters
  String get accessKey => _accessKey;
  Member? get currentMember => _currentMember;
  List<Member> get members => _members;
  List<Expense> get expenses => _expenses;
  List<PaymentRequest> get pendingPayments => _pendingPayments;
  List<PaymentRequest> get completedPayments => _completedPayments;
  List<ActivityHistory> get history => _history;
  List<GroupCategory> get categories => _categories;
  List<AppNotification> get notifications => _notifications;
  String get currency => _currency;
  double get monthlyBudget => _monthlyBudget;
  String get groupName => _groupName;
  String get paletteName => _paletteName;
  String get gradientStyle => _gradientStyle;
  bool get isDarkMode => _isDarkMode;
  bool get isGlassmorphism => _isGlassmorphism;

  // Computed
  double get balance {
    if (_currentMember == null) return 0;
    return calculateBalance(_currentMember!.id, _expenses, _members);
  }

  double get totalSpent {
    return _expenses.fold(0.0, (sum, e) => sum + e.amount);
  }

  int get expenseCount => _expenses.length;

  List<Expense> get recentExpenses {
    final sorted = List<Expense>.from(_expenses)
      ..sort((a, b) => b.date.compareTo(a.date));
    return sorted.take(10).toList();
  }

  double get currentMonthSpending {
    final now = DateTime.now();
    return _expenses
        .where((e) => e.date.month == now.month && e.date.year == now.year)
        .fold(0.0, (sum, e) => sum + e.amount);
  }

  int get unreadNotificationCount =>
      _notifications.where((n) => !n.read).length;

  List<Member> get activeMembers =>
      _members.where((m) => m.status == 'active' || m.status == null).toList();

  // Setters
  void setAccessKey(String key) {
    _accessKey = key;
    notifyListeners();
  }

  void setCurrentMember(Member member) {
    _currentMember = member;
    notifyListeners();
  }

  void updateGroupData(GroupData data) {
    _members = data.members;
    _expenses = data.expenses;
    _pendingPayments = data.pendingPayments;
    _completedPayments = data.completedPayments;
    _history = data.history;
    _categories = data.categories;
    _groupName = data.groupName;
    notifyListeners();
  }

  void updateNotifications(List<AppNotification> notifications) {
    _notifications = notifications;
    notifyListeners();
  }

  void updateCategories(List<GroupCategory> categories) {
    _categories = categories;
    notifyListeners();
  }

  void setCurrency(String currency) {
    _currency = currency;
    notifyListeners();
  }

  void setMonthlyBudget(double budget) {
    _monthlyBudget = budget;
    notifyListeners();
  }

  void setPalette(String name) {
    _paletteName = name;
    notifyListeners();
  }

  void setGradient(String style) {
    _gradientStyle = style;
    notifyListeners();
  }

  void toggleDarkMode() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
  }

  void toggleGlassmorphism() {
    _isGlassmorphism = !_isGlassmorphism;
    notifyListeners();
  }

  void updateMemberProfile({String? name, String? avatar}) {
    if (_currentMember == null) return;
    _currentMember = _currentMember!.copyWith(name: name, avatar: avatar);
    notifyListeners();
  }
}
