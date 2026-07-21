import '../models/models.dart';

Map<String, double> calculateBalanceBreakdown(
    String memberId, List<Expense> expenses, List<Member> members) {
  final Map<String, double> balance = {};
  for (final member in members) {
    if (member.id != memberId) {
      balance[member.id] = 0;
    }
  }

  for (final expense in expenses) {
    if (!expense.participants.contains(memberId)) continue;

    final perPerson = expense.amount / expense.participants.length;

    if (expense.payerId == memberId) {
      for (final pid in expense.participants) {
        if (pid != memberId) {
          balance[pid] = (balance[pid] ?? 0) + perPerson;
        }
      }
    } else {
      if (expense.participants.contains(memberId)) {
        balance[expense.payerId] = (balance[expense.payerId] ?? 0) - perPerson;
      }
    }
  }

  return balance;
}

double calculateBalance(
    String memberId, List<Expense> expenses, List<Member> members) {
  final breakdown = calculateBalanceBreakdown(memberId, expenses, members);
  return breakdown.values.fold(0.0, (sum, v) => sum + v);
}

Map<String, Map<String, double>> calculateAllPairwiseDebts(
    List<Expense> expenses, List<Member> members) {
  final Map<String, Map<String, double>> debts = {};

  for (final expense in expenses) {
    final perPerson = expense.amount / expense.participants.length;

    for (final pid in expense.participants) {
      if (pid != expense.payerId) {
        debts[pid] ??= {};
        debts[pid]![expense.payerId] =
            (debts[pid]![expense.payerId] ?? 0) + perPerson;
      }
    }
  }

  return debts;
}

List<MapEntry<String, double>> getMemberBreakdown(
    String memberId, List<Expense> expenses, List<Member> members) {
  final Map<String, double> owes = {};
  final Map<String, double> isOwed = {};

  for (final expense in expenses) {
    if (!expense.participants.contains(memberId)) continue;

    final perPerson = expense.amount / expense.participants.length;

    if (expense.payerId == memberId) {
      for (final pid in expense.participants) {
        if (pid != memberId) {
          isOwed[pid] = (isOwed[pid] ?? 0) + perPerson;
        }
      }
    } else {
      owes[expense.payerId] = (owes[expense.payerId] ?? 0) + perPerson;
    }
  }

  final Map<String, double> net = {};
  for (final entry in {...owes, ...isOwed}.entries) {
    net[entry.key] = (isOwed[entry.key] ?? 0) - (owes[entry.key] ?? 0);
  }

  final entries = net.entries.toList()
    ..sort((a, b) => b.value.compareTo(a.value));

  return entries;
}

List<Map<String, dynamic>> simplifyDebts(
    List<Expense> expenses, List<Member> members) {
  final Map<String, double> netBalances = {};

  for (final member in members) {
    netBalances[member.id] = 0;
  }

  for (final expense in expenses) {
    final perPerson = expense.amount / expense.participants.length;

    netBalances[expense.payerId] =
        (netBalances[expense.payerId] ?? 0) + expense.amount;

    for (final pid in expense.participants) {
      netBalances[pid] = (netBalances[pid] ?? 0) - perPerson;
    }
  }

  final debtors = <MapEntry<String, double>>[];
  final creditors = <MapEntry<String, double>>[];

  for (final entry in netBalances.entries) {
    if (entry.value < -0.01) {
      debtors.add(MapEntry(entry.key, entry.value.abs()));
    } else if (entry.value > 0.01) {
      creditors.add(MapEntry(entry.key, entry.value));
    }
  }

  debtors.sort((a, b) => b.value.compareTo(a.value));
  creditors.sort((a, b) => b.value.compareTo(a.value));

  final settlements = <Map<String, dynamic>>[];
  int i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    final amount = debtors[i].value < creditors[j].value
        ? debtors[i].value
        : creditors[j].value;

    if (amount > 0.01) {
      settlements.add({
        'fromId': debtors[i].key,
        'toId': creditors[j].key,
        'amount': double.parse(amount.toStringAsFixed(2)),
      });
    }

    debtors[i] = MapEntry(debtors[i].key, debtors[i].value - amount);
    creditors[j] = MapEntry(creditors[j].key, creditors[j].value - amount);

    if (debtors[i].value < 0.01) i++;
    if (creditors[j].value < 0.01) j++;
  }

  return settlements;
}
