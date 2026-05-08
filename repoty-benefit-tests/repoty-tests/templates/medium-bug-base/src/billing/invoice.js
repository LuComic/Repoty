import { getPlan } from './plans.js';
import { planChangeCredit } from './proration.js';
import { clampNonNegative } from './money.js';

export function invoiceForPlan(planId) { return { subtotalCents: getPlan(planId).monthlyCents, lines: [`Monthly plan: ${planId}`] }; }
export function invoiceForPlanChange(oldPlanId, newPlanId, remainingDays, billingPeriodDays = 30) {
  const oldPlan = getPlan(oldPlanId); const newPlan = getPlan(newPlanId);
  const adjustmentCents = planChangeCredit({ oldMonthlyCents: oldPlan.monthlyCents, newMonthlyCents: newPlan.monthlyCents, remainingDays, billingPeriodDays });
  return { adjustmentCents, amountDueCents: clampNonNegative(adjustmentCents), lines: [`Change ${oldPlanId} -> ${newPlanId}`] };
}
