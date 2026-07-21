import 'package:intl/intl.dart';

String formatCurrency(double amount, String currency) {
  final formatter = NumberFormat.currency(
    symbol: _getCurrencySymbol(currency),
    decimalDigits: 2,
    locale: 'fr_MA',
  );
  return formatter.format(amount);
}

String _getCurrencySymbol(String currency) {
  switch (currency) {
    case 'MAD':
      return 'MAD ';
    case 'EUR':
      return '€';
    case 'USD':
      return '\$';
    case 'GBP':
      return '£';
    default:
      return '$currency ';
  }
}

String formatDate(DateTime date) {
  final now = DateTime.now();
  final diff = now.difference(date);

  if (diff.inDays == 0) {
    return "Aujourd'hui";
  } else if (diff.inDays == 1) {
    return 'Hier';
  } else if (diff.inDays < 7) {
    return '${diff.inDays} jours';
  } else {
    return DateFormat('dd MMM yyyy', 'fr_FR').format(date);
  }
}

String formatFullDate(DateTime date) {
  return DateFormat('dd MMMM yyyy', 'fr_FR').format(date);
}

String formatTime(DateTime date) {
  return DateFormat('HH:mm').format(date);
}
