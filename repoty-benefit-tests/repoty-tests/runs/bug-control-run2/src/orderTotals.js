import { getItem } from './catalog.js';
import { calculateTax, roundMoney } from './tax.js';

export function subtotal(lines) {
  return roundMoney(lines.reduce((sum, line) => sum + getItem(line.sku).price * line.qty, 0));
}

export function totalForOrder(order) {
  const beforeDiscount = subtotal(order.lines);
  const discount = order.discount ?? 0;
  const taxableSubtotal = Math.max(beforeDiscount - discount, 0);
  const tax = calculateTax(taxableSubtotal, order.taxRate);
  const total = taxableSubtotal + tax;
  return roundMoney(total);
}
