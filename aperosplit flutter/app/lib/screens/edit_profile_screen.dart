import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../main.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late TextEditingController _nameController;
  late String _selectedAvatar;

  final _avatars = [
    '😊', '😎', '🤩', '😄', '🥰', '😇', '🤗', '😏',
    '🧑', '👨', '👩', '🧔', '👱', '🧑‍💻', '🧑‍🎨', '🧑‍🍳',
    '🦊', '🐱', '🐶', '🐻', '🐼', '🐨', '🦁', '🐸',
  ];

  @override
  void initState() {
    super.initState();
    final member = ref.read(appStateProvider).currentMember;
    _nameController = TextEditingController(text: member?.name ?? '');
    _selectedAvatar = member?.avatar ?? '😊';
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Modifier le profil'),
        actions: [
          TextButton(
            onPressed: _save,
            child: const Text('Enregistrer'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Avatar
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(32),
                border: Border.all(
                  color: theme.colorScheme.primary.withValues(alpha: 0.3),
                  width: 3,
                ),
              ),
              child: Center(
                child: Text(_selectedAvatar, style: const TextStyle(fontSize: 48)),
              ),
            ).animate().scale(
                  begin: const Offset(0.8, 0.8),
                  end: const Offset(1, 1),
                  duration: 400.ms,
                  curve: Curves.elasticOut,
                ),
            const SizedBox(height: 24),

            // Avatar grid
            SizedBox(
              height: 120,
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 8,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                ),
                itemCount: _avatars.length,
                itemBuilder: (context, index) {
                  final avatar = _avatars[index];
                  final isSelected = avatar == _selectedAvatar;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedAvatar = avatar),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? theme.colorScheme.primary.withValues(alpha: 0.15)
                            : theme.colorScheme.surfaceContainerHighest
                                .withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(10),
                        border: isSelected
                            ? Border.all(color: theme.colorScheme.primary, width: 2)
                            : null,
                      ),
                      child: Center(
                        child: Text(avatar, style: const TextStyle(fontSize: 18)),
                      ),
                    ),
                  );
                },
              ),
            ).animate().fadeIn(delay: 100.ms),
            const SizedBox(height: 24),

            // Name
            TextField(
              controller: _nameController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Nom',
                prefixIcon: Icon(Icons.person_outline),
              ),
            ).animate().fadeIn(delay: 200.ms),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _save,
                child: const Text('Enregistrer'),
              ),
            ).animate().fadeIn(delay: 300.ms),
          ],
        ),
      ),
    );
  }

  void _save() {
    ref.read(appStateProvider.notifier).updateMemberProfile(
          name: _nameController.text.trim(),
          avatar: _selectedAvatar,
        );
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Profil mis à jour')),
    );
  }
}
