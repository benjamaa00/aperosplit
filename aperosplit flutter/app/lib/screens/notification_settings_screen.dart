import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/app_state.dart';

class NotificationSettingsScreen extends ConsumerStatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  ConsumerState<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends ConsumerState<NotificationSettingsScreen> {
  bool _paymentRequests = true;
  bool _paymentConfirmations = true;
  bool _reminders = true;
  bool _newExpenses = true;
  bool _memberActivity = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Paramètres de notifications')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Notifications',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ).animate().fadeIn(),
            const SizedBox(height: 16),
            _buildToggle(
              theme,
              Icons.request_quote,
              'Demandes de paiement',
              'Recevoir une notification lorsqu\'un paiement vous est demandé',
              _paymentRequests,
              (v) => setState(() => _paymentRequests = v),
            ).animate().fadeIn(delay: 100.ms),
            _buildToggle(
              theme,
              Icons.check_circle_outline,
              'Confirmations de paiement',
              'Être notifié quand un paiement est confirmé',
              _paymentConfirmations,
              (v) => setState(() => _paymentConfirmations = v),
            ).animate().fadeIn(delay: 150.ms),
            _buildToggle(
              theme,
              Icons.alarm_outlined,
              'Rappels',
              'Recevoir des rappels pour les paiements en attente',
              _reminders,
              (v) => setState(() => _reminders = v),
            ).animate().fadeIn(delay: 200.ms),
            _buildToggle(
              theme,
              Icons.receipt_long,
              'Nouvelles dépenses',
              'Être notifié quand une dépense est ajoutée',
              _newExpenses,
              (v) => setState(() => _newExpenses = v),
            ).animate().fadeIn(delay: 250.ms),
            _buildToggle(
              theme,
              Icons.people_outline,
              'Activité des membres',
              'Notifications pour les nouvelles inscriptions et approbations',
              _memberActivity,
              (v) => setState(() => _memberActivity = v),
            ).animate().fadeIn(delay: 300.ms),
          ],
        ),
      ),
    );
  }

  Widget _buildToggle(
    ThemeData theme,
    IconData icon,
    String title,
    String subtitle,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      child: SwitchListTile(
        value: value,
        onChanged: onChanged,
        secondary: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 20),
        ),
        title: Text(
          title,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
          ),
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      ),
    );
  }
}
