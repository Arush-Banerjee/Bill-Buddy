import type { BalanceMap, Expense, Settlement } from "../types";

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function validateSplits(expense: Expense): string | null {
  if (expense.amount <= 0) {
    return "Amount must be greater than 0.";
  }

  if (expense.splitType === "equal") {
    return null;
  }

  const total = expense.splits.reduce((sum, split) => sum + split.value, 0);

  if (expense.splitType === "percentage" && round2(total) !== 100) {
    return "Percentage splits must add up to 100.";
  }

  if (expense.splitType === "exact" && round2(total) !== round2(expense.amount)) {
    return "Exact splits must add up to the total amount.";
  }

  return null;
}

export function calculateBalances(expenses: Expense[]): BalanceMap {
  const balances: BalanceMap = {};

  for (const expense of expenses) {
    if (!balances[expense.paidByUserId]) {
      balances[expense.paidByUserId] = 0;
    }
    balances[expense.paidByUserId] = round2(balances[expense.paidByUserId] + expense.amount);

    if (expense.splitType === "equal") {
      const share = round2(expense.amount / expense.splits.length);
      for (const split of expense.splits) {
        if (!balances[split.userId]) {
          balances[split.userId] = 0;
        }
        balances[split.userId] = round2(balances[split.userId] - share);
      }
      continue;
    }

    if (expense.splitType === "percentage") {
      for (const split of expense.splits) {
        const amount = round2((expense.amount * split.value) / 100);
        if (!balances[split.userId]) {
          balances[split.userId] = 0;
        }
        balances[split.userId] = round2(balances[split.userId] - amount);
      }
      continue;
    }

    for (const split of expense.splits) {
      if (!balances[split.userId]) {
        balances[split.userId] = 0;
      }
      balances[split.userId] = round2(balances[split.userId] - split.value);
    }
  }

  return balances;
}

export function simplifyDebts(balances: BalanceMap): Settlement[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, rawAmount] of Object.entries(balances)) {
    const amount = round2(rawAmount);
    if (amount > 0) {
      creditors.push({ userId, amount });
    } else if (amount < 0) {
      debtors.push({ userId, amount: Math.abs(amount) });
    }
  }

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const transfer = round2(Math.min(debtors[i].amount, creditors[j].amount));
    if (transfer > 0) {
      settlements.push({
        fromUserId: debtors[i].userId,
        toUserId: creditors[j].userId,
        amount: transfer,
      });
    }

    debtors[i].amount = round2(debtors[i].amount - transfer);
    creditors[j].amount = round2(creditors[j].amount - transfer);

    if (debtors[i].amount === 0) {
      i += 1;
    }
    if (creditors[j].amount === 0) {
      j += 1;
    }
  }

  return settlements;
}
