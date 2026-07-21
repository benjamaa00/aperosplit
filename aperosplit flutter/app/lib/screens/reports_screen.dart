import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import '../main.dart';
import '../utils/currency.dart';

class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final appState = ref.watch(appStateProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Exporter & Rapports')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Export Options
            Text(
              'Exporter',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ).animate().fadeIn(),
            const SizedBox(height: 12),

            _buildExportCard(
              theme,
              Icons.table_chart_outlined,
              'Export CSV',
              'Exporter toutes les dépenses en format CSV',
              () async {
                // Export CSV
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Export en cours...')),
                );
              },
            ).animate().fadeIn(delay: 100.ms),
            const SizedBox(height: 8),

            _buildExportCard(
              theme,
              Icons.qr_code,
              'QR Code d\'invitation',
              'Partagez le lien d\'invitation via QR code',
              () => _showQRCodeDialog(context, appState),
            ).animate().fadeIn(delay: 200.ms),
            const SizedBox(height: 8),

            _buildExportCard(
              theme,
              Icons.share_outlined,
              'Partager le lien',
              'Envoyez le lien d\'invitation par message',
              () {
                // Share invite link
                Share.share('Rejoins le groupe Equilibra !\nLien: https://equilibra.app/invite/xxx');
              },
            ).animate().fadeIn(delay: 300.ms),
            const SizedBox(height: 24),

            // Summary
            Text(
              'Résumé du groupe',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ).animate().fadeIn(delay: 400.ms),
            const SizedBox(height: 12),

            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  _buildSummaryRow(theme, 'Total dépensé',
                      formatCurrency(appState.totalSpent, appState.currency)),
                  const Divider(height: 24),
                  _buildSummaryRow(theme, 'Nombre de dépenses',
                      '${appState.expenseCount}'),
                  const Divider(height: 24),
                  _buildSummaryRow(theme, 'Membres actifs',
                      '${appState.activeMembers.length}'),
                  const Divider(height: 24),
                  _buildSummaryRow(theme, 'Dépenses en attente',
                      '${appState.pendingPayments.length}'),
                ],
              ),
            ).animate().fadeIn(delay: 500.ms),
          ],
        ),
      ),
    );
  }

  Widget _buildExportCard(
      ThemeData theme, IconData icon, String title, String subtitle, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: theme.colorScheme.primary, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.3),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(ThemeData theme, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        ),
        Text(
          value,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  void _showQRCodeDialog(BuildContext context, AppState appState) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('QR Code'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            QrImageView(
              data: 'https://equilibra.app/invite/xxx',
              version: QrVersions.auto,
              size: 200,
            ),
            const SizedBox(height: 16),
            const Text(
              'Scannez ce code pour rejoindre le groupe',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }
}
