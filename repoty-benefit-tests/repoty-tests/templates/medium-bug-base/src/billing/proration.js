import { clampNonNegative, roundCents } from './money.js';

export function daysBetween(start, end) {
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

export function prorateMonthlyAmount(monthlyCents, activeDays, billingPeriodDays) {
  if (billingPeriodDays <= 0) throw new Error('billingPeriodDays must be positive');
  return clampNonNegative((monthlyCents * activeDays) / billingPeriodDays);
}

export function planChangeCredit({ oldMonthlyCents, newMonthlyCents, remainingDays, billingPeriodDays }) {
  const oldCredit = prorateMonthlyAmount(oldMonthlyCents, remainingDays, billingPeriodDays);
  const newCharge = prorateMonthlyAmount(newMonthlyCents, remainingDays, billingPeriodDays);
  // BUG: upgrades should charge the difference, downgrades should create a credit.
  return roundCents(oldCredit - newCharge);
}
