import 'package:flutter/material.dart';

class AppTheme {
  static const Map<String, Color> paletteColors = {
    'Violet': Color(0xFF8B5CF6),
    'Blue': Color(0xFF3B82F6),
    'Indigo': Color(0xFF6366F1),
    'Sky': Color(0xFF0EA5E9),
    'Cyan': Color(0xFF06B6D4),
    'Teal': Color(0xFF14B8A6),
    'Emerald': Color(0xFF10B981),
    'Lime': Color(0xFF84CC16),
    'Amber': Color(0xFFF59E0B),
    'Orange': Color(0xFFF97316),
    'Red': Color(0xFFEF4444),
    'Rose': Color(0xFFF43F5E),
    'Pink': Color(0xFFEC4899),
    'Fuchsia': Color(0xFFD946EF),
    'Slate': Color(0xFF64748B),
  };

  static const Map<String, List<Color>> gradients = {
    'None': [],
    'Subtle': [Color(0xFFF8FAFC), Color(0xFFF1F5F9)],
    'Vivid': [Color(0xFF8B5CF6), Color(0xFF3B82F6)],
    'Aurora': [Color(0xFF6366F1), Color(0xFF06B6D4), Color(0xFF10B981)],
    'Sunset': [Color(0xFFF97316), Color(0xFFEF4444), Color(0xFFEC4899)],
    'Ocean': [Color(0xFF0EA5E9), Color(0xFF3B82F6), Color(0xFF6366F1)],
    'Forest': [Color(0xFF10B981), Color(0xFF059669), Color(0xFF047857)],
    'Neon': [Color(0xFF8B5CF6), Color(0xFFEC4899), Color(0xFFF43F5E)],
    'Warm': [Color(0xFFF59E0B), Color(0xFFF97316), Color(0xFFEF4444)],
    'Cool': [Color(0xFF06B6D4), Color(0xFF3B82F6), Color(0xFF8B5CF6)],
  };

  static ThemeData getTheme(String paletteName, {String gradientStyle = 'None', bool isDark = false}) {
    final primaryColor = paletteColors[paletteName] ?? paletteColors['Violet']!;
    
    final colorScheme = isDark
        ? ColorScheme.dark(
            primary: primaryColor,
            secondary: primaryColor.withValues(alpha: 0.7),
            surface: const Color(0xFF1A1A2E),
            surfaceContainer: const Color(0xFF16213E),
            onSurface: Colors.white,
          )
        : ColorScheme.light(
            primary: primaryColor,
            secondary: primaryColor.withValues(alpha: 0.7),
            surface: Colors.white,
            surfaceContainer: const Color(0xFFF8FAFC),
            onSurface: const Color(0xFF1E293B),
          );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      fontFamily: 'Inter',
      appBarTheme: AppBarTheme(
        backgroundColor: isDark ? const Color(0xFF1A1A2E) : Colors.white,
        foregroundColor: isDark ? Colors.white : const Color(0xFF1E293B),
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: isDark ? Colors.white : const Color(0xFF1E293B),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        color: isDark ? const Color(0xFF16213E) : Colors.white,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: isDark ? const Color(0xFF0F0F23) : Colors.white,
        selectedItemColor: primaryColor,
        unselectedItemColor: isDark ? Colors.white38 : Colors.grey,
        type: BottomNavigationBarType.fixed,
        elevation: 20,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF1F5F9),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: primaryColor, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: isDark ? const Color(0xFF16213E) : const Color(0xFF1E293B),
        contentTextStyle: const TextStyle(fontFamily: 'Inter', color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
