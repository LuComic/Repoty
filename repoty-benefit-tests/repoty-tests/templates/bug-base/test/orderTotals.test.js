import test from 'node:test';
import assert from 'node:assert/strict';
import { totalForOrder } from '../src/index.js';

test('fixed discount reduces taxable subtotal before tax', () => {
  const total = totalForOrder({
    taxRate: 0.2,
    discount: 5,
    lines: [{ sku: 'bag', qty: 1 }]
  });
  assert.equal(total, 15.6);
});

test('total never goes below zero', () => {
  const total = totalForOrder({ taxRate: 0.2, discount: 100, lines: [{ sku: 'pen', qty: 1 }] });
  assert.equal(total, 0);
});
