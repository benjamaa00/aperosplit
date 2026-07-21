import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router/app_router.dart';
import 'providers/app_state.dart';
import 'themes/app_theme.dart';

export 'providers/app_state.dart';

final appStateProvider = ChangeNotifierProvider<AppState>((ref) {
  return AppState();
});

class AperoSplitApp extends ConsumerWidget {
  const AperoSplitApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appState = ref.watch(appStateProvider);

    return MaterialApp.router(
      title: 'AperoSplit',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.getTheme(
        appState.paletteName,
        gradientStyle: appState.gradientStyle,
        isDark: false,
      ),
      darkTheme: AppTheme.getTheme(
        appState.paletteName,
        gradientStyle: appState.gradientStyle,
        isDark: true,
      ),
      themeMode: appState.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      routerConfig: goRouter,
      locale: const Locale('fr', 'FR'),
      supportedLocales: const [
        Locale('fr', 'FR'),
        Locale('en', 'US'),
      ],
    );
  }
}

void main() {
  runApp(
    const ProviderScope(
      child: AperoSplitApp(),
    ),
  );
}
