import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../providers/app_state.dart';

class ProfileTab extends ConsumerWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final appState = ref.watch(appStateProvider);
    final member = appState.currentMember;

    if (member == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Profil',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 24),

          // Profile Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: theme.colorScheme.primary.withValues(alpha: 0.2),
                width: 1.5,
              ),
            ),
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Center(
                    child: Text(member.avatar, style: const TextStyle(fontSize: 42)),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  member.name,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    member.role == 'admin' ? 'Administrateur' : 'Membre',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 100.ms).scale(
                begin: const Offset(0.95, 0.95),
                end: const Offset(1, 1),
              ),
          const SizedBox(height: 24),

          // Menu Items
          _buildMenuItem(
            theme,
            Icons.person_outline,
            'Modifier le profil',
            () => context.push('/edit-profile'),
          ).animate().fadeIn(delay: 200.ms),
          _buildMenuItem(
            theme,
            Icons.people_outline,
            'Gestion des membres',
            () => context.push('/members'),
          ).animate().fadeIn(delay: 250.ms),
          _buildMenuItem(
            theme,
            Icons.category_outlined,
            'Gestion des catégories',
            () => context.push('/categories'),
          ).animate().fadeIn(delay: 300.ms),
          _buildMenuItem(
            theme,
            Icons.notifications_outlined,
            'Notifications',
            () => context.push('/notifications'),
            badge: appState.unreadNotificationCount,
          ).animate().fadeIn(delay: 350.ms),
          _buildMenuItem(
            theme,
            Icons.download_outlined,
            'Exporter & Rapports',
            () => context.push('/reports'),
          ).animate().fadeIn(delay: 400.ms),
          _buildMenuItem(
            theme,
            Icons.settings_outlined,
            'Paramètres',
            () => context.push('/settings'),
          ).animate().fadeIn(delay: 450.ms),
          _buildMenuItem(
            theme,
            Icons.palette_outlined,
            'Apparence',
            () => context.push('/appearance'),
          ).animate().fadeIn(delay: 500.ms),
          const SizedBox(height: 24),

          // Members List
          Text(
            'Membres du groupe',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ).animate().fadeIn(delay: 550.ms),
          const SizedBox(height: 12),
          ...appState.members.asMap().entries.map((entry) {
            final m = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Text(m.avatar, style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${m.name}${m.id == member.id ? ' (vous)' : ''}',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          m.role == 'admin' ? 'Administrateur' : 'Membre',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    m.status == 'active' || m.status == null
                        ? Icons.circle
                        : Icons.pending_outlined,
                    size: 8,
                    color: m.status == 'active' || m.status == null
                        ? Colors.green
                        : Colors.orange,
                  ),
                ],
              ),
            ).animate().fadeIn(delay: Duration(milliseconds: 600 + entry.key * 50));
          }),
        ],
      ),
    );
  }

  Widget _buildMenuItem(ThemeData theme, IconData icon, String title,
      VoidCallback onTap, {int badge = 0}) {
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
        title: Text(
          title,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        trailing: Badge(
          label: badge > 0 ? Text('$badge') : null,
          child: Icon(
            Icons.chevron_right,
            color: theme.colorScheme.onSurface.withValues(alpha: 0.3),
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
