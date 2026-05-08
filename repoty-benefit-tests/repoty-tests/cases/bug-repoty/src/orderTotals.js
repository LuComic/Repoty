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
