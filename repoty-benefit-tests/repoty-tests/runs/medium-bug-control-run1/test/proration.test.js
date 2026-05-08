import test from 'node:test';
import assert from 'node:assert/strict';
import { invoiceForPlanChange } from '../src/index.js';

test('upgrade charges prorated difference for remaining days', () => {
  const invoice = invoiceForPlanChange('starter', 'growth', 15, 30);
  assert.equal(invoice.adjustmentCents, 1850);
  assert.equal(invoice.amountDueCents, 1850);
});

test('downgrade produces negative adjustment credit and no amount due', () => {
  const invoice = invoiceForPlanChange('growth', 'starter', 15, 30);
  assert.equal(invoice.adjustmentCents, -1850);
  assert.equal(invoice.amountDueCents, 0);
});
