import { Debt } from '../types';

export interface PayoffStrategyResult {
  strategy: 'snowball' | 'avalanche';
  totalMonths: number;
  totalInterestMinor: number;
  totalPaidMinor: number;
  payoffOrder: {
    debtId: string;
    debtName: string;
    monthsToPayoff: number;
    interestPaidMinor: number;
  }[];
}

/**
 * Calculates debt payoff for Snowball (lowest balance first) or Avalanche (highest APR first)
 * extraMonthlyPaymentMinor: optional extra monthly cash thrown at the priority debt
 */
export function calculateDebtPayoff(
  debts: Debt[],
  strategy: 'snowball' | 'avalanche',
  extraMonthlyPaymentMinor = 0
): PayoffStrategyResult {
  if (!debts || debts.length === 0) {
    return {
      strategy,
      totalMonths: 0,
      totalInterestMinor: 0,
      totalPaidMinor: 0,
      payoffOrder: [],
    };
  }

  // Clone active debts
  const workingDebts = debts
    .filter((d) => d.balance_minor > 0)
    .map((d) => ({
      ...d,
      currentBalance: d.balance_minor,
      accumulatedInterest: 0,
      payoffMonth: 0,
    }));

  if (workingDebts.length === 0) {
    return {
      strategy,
      totalMonths: 0,
      totalInterestMinor: 0,
      totalPaidMinor: 0,
      payoffOrder: [],
    };
  }

  let month = 0;
  const maxMonths = 360; // 30-year safety cap
  let totalInterestMinor = 0;
  let totalPaidMinor = 0;

  while (workingDebts.some((d) => d.currentBalance > 0) && month < maxMonths) {
    month++;

    // 1. Sort active debts by strategy:
    // Snowball: lowest balance first
    // Avalanche: highest APR first
    const activeDebts = workingDebts.filter((d) => d.currentBalance > 0);
    activeDebts.sort((a, b) => {
      if (strategy === 'snowball') {
        return a.currentBalance - b.currentBalance;
      } else {
        return b.apr_bps - a.apr_bps;
      }
    });

    let extraPool = extraMonthlyPaymentMinor;

    // 2. Add rollover payments from previously cleared debts
    for (const d of workingDebts) {
      if (d.currentBalance <= 0 && d.payoffMonth < month) {
        extraPool += d.min_payment_minor;
      }
    }

    // 3. Accrue interest & pay minimums
    for (const d of activeDebts) {
      // Monthly interest: (balance * (apr_bps / 10000)) / 12
      const monthlyRate = d.apr_bps / 10000 / 12;
      const interest = Math.round(d.currentBalance * monthlyRate);
      d.accumulatedInterest += interest;
      totalInterestMinor += interest;
      d.currentBalance += interest;

      // Minimum payment
      const payment = Math.min(d.currentBalance, d.min_payment_minor);
      d.currentBalance -= payment;
      totalPaidMinor += payment;

      if (d.currentBalance <= 0 && d.payoffMonth === 0) {
        d.payoffMonth = month;
      }
    }

    // 4. Throw extra pool at top priority debt
    const priorityDebt = activeDebts.find((d) => d.currentBalance > 0);
    if (priorityDebt && extraPool > 0) {
      const extraPay = Math.min(priorityDebt.currentBalance, extraPool);
      priorityDebt.currentBalance -= extraPay;
      totalPaidMinor += extraPay;
      extraPool -= extraPay;

      if (priorityDebt.currentBalance <= 0 && priorityDebt.payoffMonth === 0) {
        priorityDebt.payoffMonth = month;
      }
    }
  }

  return {
    strategy,
    totalMonths: month,
    totalInterestMinor,
    totalPaidMinor,
    payoffOrder: workingDebts.map((d) => ({
      debtId: d.id,
      debtName: d.name,
      monthsToPayoff: d.payoffMonth || month,
      interestPaidMinor: d.accumulatedInterest,
    })),
  };
}
