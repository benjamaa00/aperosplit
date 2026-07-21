import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../main.dart';
import '../utils/currency.dart';
import '../utils/debts.dart';

class BalancesTab extends ConsumerWidget {
  const BalancesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final appState = ref.watch(appStateProvider);
    final settlements = simplifyDebts(appState.expenses, appState.members);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Balances',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 8),
          Text(
            'Dettes simplifiées du groupe',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ).animate().fadeIn(delay: 100.ms),
          const SizedBox(height: 20),

          // Member Balances
          ...appState.activeMembers.asMap().entries.map((entry) {
            final member = entry.value;
            final memberBalance = calculateBalance(
              member.id,
              appState.expenses,
              appState.members,
            );
            return _buildMemberBalance(
              theme,
              member,
              memberBalance,
              appState.currency,
              member.id == appState.currentMember?.id,
            ).animate()
                .fadeIn(delay: Duration(milliseconds: 200 + entry.key * 50))
                .slideX(begin: -0.05);
          }),

          if (appState.activeMembers.isNotEmpty) const SizedBox(height: 24),

          // Simplified Settlements
          Text(
            'Simplification des dettes',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ).animate().fadeIn(delay: 400.ms),
          const SizedBox(height: 12),

          if (settlements.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  const Text('✅', style: TextStyle(fontSize: 48)),
                  const SizedBox(height: 16),
                  Text(
                    'Tout est settled !',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Aucune dette à régler',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(delay: 500.ms)
          else
            ...settlements.asMap().entries.map((entry) {
              final settlement = entry.value;
              final fromMember = appState.members
                  .where((m) => m.id == settlement['fromId'])
                  .firstOrNull;
              final toMember = appState.members
                  .where((m) => m.id == settlement['toId'])
                  .firstOrNull;

              return _buildSettlementCard(
                theme,
                fromMember,
                toMember,
                settlement['amount'] as double,
                appState.currency,
              ).animate()
                  .fadeIn(delay: Duration(milliseconds: 500 + entry.key * 50))
                  .slideX(begin: 0.05);
            }),
        ],
      ),
    );
  }

  Widget _buildMemberBalance(
      ThemeData theme, dynamic member, double balance, String currency, bool isCurrent) {
    final isPositive = balance > 0;
    final isZero = balance.abs() < 0.01;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCurrent
            ? theme.colorScheme.primary.withValues(alpha: 0.08)
            : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(16),
        border: isCurrent
            ? Border.all(
                color: theme.colorScheme.primary.withValues(alpha: 0.3),
                width: 1.5,
              )
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(member.avatar, style: const TextStyle(fontSize: 24)),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${member.name}${isCurrent ? ' (vous)' : ''}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  isZero
                      ? 'Équilibré'
                      : isPositive
                          ? 'Créancier'
                          : 'Débiteur',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isZero
                        ? Colors.grey
                        : isPositive
                            ? Colors.green
                            : Colors.red,
                  ),
                ),
              ],
            ),
          ),
          Text(
            isZero
                ? '0.00'
                : '${isPositive ? '+' : ''}${formatCurrency(balance, currency)}',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: isZero
                  ? Colors.grey
                  : isPositive
                      ? Colors.green
                      : Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettlementCard(ThemeData theme, dynamic from, dynamic to,
      double amount, String currency) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Column(
            children: [
              Text(from?.avatar ?? '👤', style: const TextStyle(fontSize: 24)),
              const SizedBox(height: 4),
              Text(
                from?.name ?? '?',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              children: [
                Icon(
                  Icons.arrow_forward,
                  color: theme.colorScheme.primary,
                ),
                Text(
                  formatCurrency(amount, currency),
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            children: [
              Text(to?.avatar ?? '👤', style: const TextStyle(fontSize: 24)),
              const SizedBox(height: 4),
              Text(
                to?.name ?? '?',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
