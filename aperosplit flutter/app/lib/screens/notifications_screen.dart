import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../main.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final appState = ref.watch(appStateProvider);
    final notifications = appState.notifications;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notifications.any((n) => !n.read))
            TextButton(
              onPressed: () {
                // Mark all as read
              },
              child: const Text('Tout lire'),
            ),
        ],
      ),
      body: notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('🔔', style: TextStyle(fontSize: 56)),
                  const SizedBox(height: 16),
                  Text(
                    'Aucune notification',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Vous serez notifié des nouveaux paiements',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: notification.read
                        ? theme.colorScheme.surfaceContainerHighest
                            .withValues(alpha: 0.3)
                        : theme.colorScheme.primary.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: notification.read
                        ? null
                        : Border.all(
                            color: theme.colorScheme.primary.withValues(alpha: 0.2),
                            width: 1,
                          ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: _getNotificationColor(notification.type)
                              .withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Icon(
                            _getNotificationIcon(notification.type),
                            size: 20,
                            color: _getNotificationColor(notification.type),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              notification.title,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: notification.read
                                    ? FontWeight.w500
                                    : FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              notification.message,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface
                                    .withValues(alpha: 0.6),
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      if (!notification.read)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                ).animate()
                    .fadeIn(delay: Duration(milliseconds: 100 + index * 50))
                    .slideX(begin: 0.05);
              },
            ),
    );
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'payment_request':
        return Colors.blue;
      case 'payment_confirmed':
        return Colors.green;
      case 'payment_refused':
        return Colors.red;
      case 'reminder':
        return Colors.orange;
      case 'expense_added':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'payment_request':
        return Icons.request_quote;
      case 'payment_confirmed':
        return Icons.check_circle_outline;
      case 'payment_refused':
        return Icons.cancel_outlined;
      case 'reminder':
        return Icons.alarm_outlined;
      case 'expense_added':
        return Icons.receipt_long;
      default:
        return Icons.notifications_outlined;
    }
  }
}
