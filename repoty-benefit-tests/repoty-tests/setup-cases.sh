#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"
rm -rf templates cases results
mkdir -p templates/bug-base/src templates/bug-base/test templates/feature-base/src templates/feature-base/test results/raw

cat > templates/bug-base/package.json <<'JSON'
{"name":"repoty-bug-case","version":"1.0.0","type":"module","scripts":{"test":"node --test"}}
JSON
cat > templates/bug-base/README.md <<'MD'
# Bug case
Small order pricing library. The tests describe expected behavior.
MD
cat > templates/bug-base/src/catalog.js <<'JS'
export const catalog = new Map([
  ['notebook', { name: 'Notebook', price: 7.5 }],
  ['pen', { name: 'Pen', price: 1.25 }],
  ['bag', { name: 'Canvas Bag', price: 18 }]
]);

export function getItem(sku) {
  const item = catalog.get(sku);
  if (!item) throw new Error(`Unknown sku: ${sku}`);
  return item;
}
JS
cat > templates/bug-base/src/tax.js <<'JS'
export function calculateTax(amount, rate = 0.2) {
  return roundMoney(amount * rate);
}

export function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
JS
cat > templates/bug-base/src/orderTotals.js <<'JS'
import { getItem } from './catalog.js';
import { calculateTax, roundMoney } from './tax.js';

export function subtotal(lines) {
  return roundMoney(lines.reduce((sum, line) => sum + getItem(line.sku).price * line.qty, 0));
}

export function totalForOrder(order) {
  const beforeDiscount = subtotal(order.lines);
  const tax = calculateTax(beforeDiscount, order.taxRate);
  const discount = order.discount ?? 0;
  // BUG: fixed-value discounts should reduce the taxable amount before tax is calculated.
  const total = beforeDiscount + tax - discount;
  return roundMoney(Math.max(total, 0));
}
JS
cat > templates/bug-base/src/index.js <<'JS'
export { totalForOrder, subtotal } from './orderTotals.js';
export { catalog, getItem } from './catalog.js';
JS
cat > templates/bug-base/test/orderTotals.test.js <<'JS'
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
JS

cat > templates/feature-base/package.json <<'JSON'
{"name":"repoty-feature-case","version":"1.0.0","type":"module","scripts":{"test":"node --test"}}
JSON
cat > templates/feature-base/README.md <<'MD'
# Feature case
Tiny support queue package.

Feature request: add priority ordering so urgent tickets are handled before normal tickets.
MD
cat > templates/feature-base/src/ticket.js <<'JS'
export function createTicket(id, title, priority = 'normal') {
  if (!['low', 'normal', 'high', 'urgent'].includes(priority)) throw new Error('Invalid priority');
  return { id, title, priority, createdAt: Date.now(), closed: false };
}
JS
cat > templates/feature-base/src/queue.js <<'JS'
export class TicketQueue {
  constructor() {
    this.items = [];
  }

  add(ticket) {
    this.items.push(ticket);
  }

  next() {
    return this.items.find((ticket) => !ticket.closed) ?? null;
  }

  close(id) {
    const ticket = this.items.find((item) => item.id === id);
    if (ticket) ticket.closed = true;
    return ticket ?? null;
  }
}
JS
cat > templates/feature-base/src/index.js <<'JS'
export { createTicket } from './ticket.js';
export { TicketQueue } from './queue.js';
JS
cat > templates/feature-base/test/queue.test.js <<'JS'
import test from 'node:test';
import assert from 'node:assert/strict';
import { TicketQueue, createTicket } from '../src/index.js';

test('next returns the highest priority open ticket', () => {
  const queue = new TicketQueue();
  queue.add(createTicket('a', 'docs typo', 'low'));
  queue.add(createTicket('b', 'payment broken', 'urgent'));
  queue.add(createTicket('c', 'slow report', 'high'));
  assert.equal(queue.next().id, 'b');
});

test('closed urgent tickets are skipped and high priority wins over normal', () => {
  const queue = new TicketQueue();
  queue.add(createTicket('a', 'normal thing', 'normal'));
  queue.add(createTicket('b', 'urgent thing', 'urgent'));
  queue.add(createTicket('c', 'high thing', 'high'));
  queue.close('b');
  assert.equal(queue.next().id, 'c');
});
JS

mkdir -p cases
for case in bug feature; do
  for cond in control repoty; do
    cp -R "templates/${case}-base" "cases/${case}-${cond}"
  done
done
