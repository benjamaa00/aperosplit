import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../screens/splash_screen.dart';
import '../screens/access_screen.dart';
import '../screens/identity_screen.dart';
import '../screens/register_screen.dart';
import '../screens/invite_screen.dart';
import '../screens/main_shell.dart';
import '../screens/home_tab.dart';
import '../screens/expenses_tab.dart';
import '../screens/balances_tab.dart';
import '../screens/stats_tab.dart';
import '../screens/profile_tab.dart';
import '../screens/settings_screen.dart';
import '../screens/appearance_screen.dart';
import '../screens/member_management_screen.dart';
import '../screens/category_management_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/reports_screen.dart';
import '../screens/edit_profile_screen.dart';

final goRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/access',
      builder: (context, state) => const AccessScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/identity',
      builder: (context, state) => const IdentityScreen(),
    ),
    GoRoute(
      path: '/invite',
      builder: (context, state) {
        final token = state.uri.queryParameters['token'] ?? '';
        return InviteScreen(inviteToken: token);
      },
    ),
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(
          path: '/',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: HomeTab(),
          ),
        ),
        GoRoute(
          path: '/expenses',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: ExpensesTab(),
          ),
        ),
        GoRoute(
          path: '/balances',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: BalancesTab(),
          ),
        ),
        GoRoute(
          path: '/stats',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: StatsTab(),
          ),
        ),
        GoRoute(
          path: '/profile',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: ProfileTab(),
          ),
        ),
      ],
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: '/appearance',
      builder: (context, state) => const AppearanceScreen(),
    ),
    GoRoute(
      path: '/members',
      builder: (context, state) => const MemberManagementScreen(),
    ),
    GoRoute(
      path: '/categories',
      builder: (context, state) => const CategoryManagementScreen(),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/reports',
      builder: (context, state) => const ReportsScreen(),
    ),
    GoRoute(
      path: '/edit-profile',
      builder: (context, state) => const EditProfileScreen(),
    ),
  ],
);
