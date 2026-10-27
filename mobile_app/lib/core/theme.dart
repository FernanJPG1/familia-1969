import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Luxury Dark Palette
  static const Color background = Color(0xFF080C14);
  static const Color surface = Color(0xFF0E1524);
  static const Color card = Color(0xFF131B2D);
  static const Color cardActive = Color(0xFF192338);

  static const Color borderSubtle = Color(0x1FFFFFFF);
  static const Color borderActive = Color(0x4DF59E0B);

  static const Color goldPrimary = Color(0xFFF59E0B);
  static const Color goldDark = Color(0xFFD97706);

  static const Color textMain = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);

  static const Color accentEmerald = Color(0xFF10B981);
  static const Color accentBlue = Color(0xFF3B82F6);
  static const Color accentRose = Color(0xFFEF4444);

  static const LinearGradient goldGradient = LinearGradient(
    colors: [goldPrimary, goldDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static ThemeData get darkTheme {
    final baseText = GoogleFonts.plusJakartaSansTextTheme(ThemeData.dark().textTheme);

    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: goldPrimary,
      canvasColor: surface,
      colorScheme: const ColorScheme.dark(
        primary: goldPrimary,
        secondary: goldDark,
        surface: surface,
        error: accentRose,
        onPrimary: Color(0xFF080C14),
        onSurface: textMain,
      ),
      textTheme: baseText.copyWith(
        headlineLarge: GoogleFonts.outfit(
          fontSize: 26,
          fontWeight: FontWeight.w800,
          color: textMain,
        ),
        headlineMedium: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w800,
          color: textMain,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: textMain,
        ),
        bodyLarge: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          color: textMain,
        ),
        bodyMedium: GoogleFonts.plusJakartaSans(
          fontSize: 13,
          color: textMuted,
        ),
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderSubtle),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: goldPrimary,
        unselectedItemColor: textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 10,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: goldPrimary),
        ),
        labelStyle: GoogleFonts.plusJakartaSans(color: textMuted, fontSize: 13),
        hintStyle: GoogleFonts.plusJakartaSans(color: textMuted.withValues(alpha: 0.6), fontSize: 13),
      ),
    );
  }
}
