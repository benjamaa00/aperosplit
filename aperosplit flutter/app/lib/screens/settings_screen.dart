import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../main.dart';
import '../utils/currency.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  late double _budget;
  late String _currency;

  @override
  void initState() {
    super.initState();
    _budget = ref.read(appStateProvider).monthlyBudget;
    _currency = ref.read(appStateProvider).currency;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appState = ref.watch(appStateProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Paramètres')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Budget
            Text(
              'Budget mensuel',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ).animate().fadeIn(),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  Text(
                    formatCurrency(_budget, _currency),
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Slider(
                    value: _budget,
                    min: 0,
                    max: 10000,
                    divisions: 100,
                    onChanged: (v) => setState(() => _budget = v),
                    onChangeEnd: (v) {
                      ref.read(appStateProvider.notifier).setMonthlyBudget(v);
                    },
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('0', style: theme.textTheme.bodySmall),
                      Text('10 000 ${_currency}',
                          style: theme.textTheme.bodySmall),
                    ],
                  ),
                ],
              ),
            ).animate().fadeIn(delay: 100.ms),
            const SizedBox(height: 24),

            // Currency
            Text(
              'Devise',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ).animate().fadeIn(delay: 200.ms),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ['MAD', 'EUR', 'USD', 'GBP'].map((c) {
                final isSelected = c == _currency;
                return GestureDetector(
                  onTap: () {
                    setState(() => _currency = c);
                    ref.read(appStateProvider.notifier).setCurrency(c);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? theme.colorScheme.primary
                          : theme.colorScheme.surfaceContainerHighest
                              .withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      c,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: isSelected
                            ? Colors.white
                            : theme.colorScheme.onSurface,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ).animate().fadeIn(delay: 300.ms),
            const SizedBox(height: 24),

            // Group Settings (admin only)
            if (appState.currentMember?.role == 'admin') ...[
              Text(
                'Paramètres du groupe',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ).animate().fadeIn(delay: 400.ms),
              const SizedBox(height: 12),
              _buildSettingTile(
                theme,
                Icons.lock_outline,
                'Code d\'accès',
                appState.accessKey.isNotEmpty ? 'Modifié' : 'Non défini',
                () {},
              ),
              _buildSettingTile(
                theme,
                Icons.group_add_outlined,
                'Approbation des membres',
                'Approuver les nouveaux membres',
                () {},
                trailing: Switch(
                  value: false,
                  onChanged: (v) {},
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSettingTile(
      ThemeData theme, IconData icon, String title, String subtitle,
      VoidCallback onTap, {Widget? trailing}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
            fontSize: 12,
          ),
        ),
        trailing: trailing ?? Icon(
          Icons.chevron_right,
          color: theme.colorScheme.onSurface.withValues(alpha: 0.3),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      ),
    );
  }
}
