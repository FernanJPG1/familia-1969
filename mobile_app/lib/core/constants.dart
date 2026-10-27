import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';

class AppConstants {
  // Configurable base URL
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:3000';
    // If android emulator, use 10.0.2.2; on Windows/desktop, use localhost
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:3000'
        : 'http://localhost:3000';
  }

  static final currencyFormat = NumberFormat.currency(
    locale: 'es_CO',
    symbol: '\$',
    decimalDigits: 0,
  );

  static String formatPrice(num price) {
    return currencyFormat.format(price);
  }

  static String formatTime(DateTime dt) {
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final minute = dt.minute.toString().padLeft(2, '0');
    final period = dt.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  static const List<String> dayNames = [
    'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'
  ];
}
