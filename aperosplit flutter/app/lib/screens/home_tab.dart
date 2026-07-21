import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../main.dart';
import '../utils/currency.dart';
import '../utils/debts.dart';

class HomeTab extends ConsumerWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final appState = ref.watch(appStateProvider);
    final member = appState.currentMember;

    if (member == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final balance = appState.balance;
    final totalSpent = appState.totalSpent;
    final expenseCount = appState.expenseCount;
    final currentMonthSpending = appState.currentMonthSpending;
    final budgetPercentage = appState.monthlyBudget > 0
        ? (currentMonthSpending / appState.monthlyBudget * 100).clamp(0.0, 100.0)
        : 0.0;
    final breakdown = getMemberBreakdown(member.id, appState.expenses, appState.members);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Greeting
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bonjour,',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    '${member.name} ${member.avatar}',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              IconButton(
                onPressed: () => context.push('/notifications'),
                icon: Badge(
                  label: appState.unreadNotificationCount > 0
                      ? Text('${appState.unreadNotificationCount}')
                      : null,
                  child: Icon(
                    Icons.notifications_outlined,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),
            ],
          ).animate().fadeIn().slideY(begin: -0.1),
          const SizedBox(height: 20),

          // Balance Card
          _buildBalanceCard(theme, balance, appState.currency)
              .animate()
              .fadeIn(delay: 100.ms)
              .slideY(begin: 0.1),
          const SizedBox(height: 16),

          // Stats Row
          Row(
            children: [
              _buildStatCard(
                theme,
                'Total dépensé',
                formatCurrency(totalSpent, appState.currency),
                Icons.receipt_long,
                Colors.blue,
              ),
              const SizedBox(width: 12),
              _buildStatCard(
                theme,
                'Dépenses',
                '$expenseCount',
                Icons.category_outlined,
                Colors.purple,
              ),
            ],
          ).animate().fadeIn(delay: 200.ms),
          const SizedBox(height: 16),

          // Budget Progress
          if (appState.monthlyBudget > 0)
            _buildBudgetCard(
              theme,
              currentMonthSpending,
              appState.monthlyBudget,
              budgetPercentage,
              appState.currency,
            ).animate().fadeIn(delay: 300.ms),
          if (appState.monthlyBudget > 0) const SizedBox(height: 16),

          // Member Breakdown
          if (breakdown.isNotEmpty)
            _buildBreakdownCard(theme, breakdown, appState.members, appState.currency)
                .animate().fadeIn(delay: 400.ms),
          if (breakdown.isNotEmpty) const SizedBox(height: 16),

          // Recent Expenses
          Text(
            'Dépenses récentes',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ).animate().fadeIn(delay: 500.ms),
          const SizedBox(height: 12),
          if (appState.recentExpenses.isEmpty)
            _buildEmptyState(theme, 'Aucune dépense', 'Ajoutez votre première dépense !')
          else
            ...appState.recentExpenses.asMap().entries.map((entry) {
              final expense = entry.value;
              final payer = appState.members
                  .where((m) => m.id == expense.payerId)
                  .firstOrNull;
              return _buildExpenseItem(theme, expense, payer, appState.currency)
                  .animate()
                  .fadeIn(delay: Duration(milliseconds: 500 + entry.key * 50))
                  .slideX(begin: 0.05);
            }),
        ],
      ),
    );
  }

  Widget _buildBalanceCard(ThemeData theme, double balance, String currency) {
    final isPositive = balance >= 0;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isPositive
              ? [const Color(0xFF10B981), const Color(0xFF059669)]
              : [const Color(0xFFEF4444), const Color(0xFFDC2626)],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: (isPositive ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                .withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isPositive ? Icons.trending_up : Icons.trending_down,
                color: Colors.white.withValues(alpha: 0.8),
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Votre solde',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            formatCurrency(balance.abs(), currency),
            style: theme.textTheme.displaySmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              letterSpacing: -2,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            isPositive ? 'Vous êtes créditeur' : 'Vous êtes débiteur',
            style: theme.textTheme.bodySmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
      ThemeData theme, String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 12),
            Text(
              value,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBudgetCard(
      ThemeData theme, double spent, double budget, double percentage, String currency) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Budget mensuel',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                '${percentage.toStringAsFixed(0)}%',
                style: theme.textTheme.titleSmall?.copyWith(
                  color: percentage > 80 ? Colors.red : theme.colorScheme.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: percentage / 100,
              minHeight: 8,
              backgroundColor: theme.colorScheme.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation<Color>(
                percentage > 80
                    ? Colors.red
                    : percentage > 60
                        ? Colors.orange
                        : theme.colorScheme.primary,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${formatCurrency(spent, currency)} / ${formatCurrency(budget, currency)}',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBreakdownCard(ThemeData theme, List<MapEntry<String, double>> breakdown,
      List<dynamic> members, String currency) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Répartition',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          ...breakdown.take(5).map((entry) {
            final member = members.where((m) => m.id == entry.key).firstOrNull;
            final isPositive = entry.value > 0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Text(
                    member?.avatar ?? '👤',
                    style: const TextStyle(fontSize: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      member?.name ?? entry.key,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                  Text(
                    '${isPositive ? '+' : ''}${formatCurrency(entry.value, currency)}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isPositive ? Colors.green : Colors.red,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildExpenseItem(
      ThemeData theme, dynamic expense, dynamic payer, String currency) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(
                expense.categoryEmoji,
                style: const TextStyle(fontSize: 22),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  expense.description,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  'Payé par ${payer?.name ?? 'Inconnu'}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
          ),
          Text(
            formatCurrency(expense.amount, currency),
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme, String title, String subtitle) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          const Text('📭', style: TextStyle(fontSize: 48)),
          const SizedBox(height: 16),
          Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }
}
