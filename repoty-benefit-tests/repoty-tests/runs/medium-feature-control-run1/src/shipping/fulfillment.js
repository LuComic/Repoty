import { markReady } from '../orders/order.js';

export class FulfillmentService {
  constructor(inventory) { this.inventory = inventory; }

  prepare(order) {
    const required = new Map();

    for (const line of order.lines) {
      required.set(line.sku, (required.get(line.sku) ?? 0) + line.qty);
    }

    for (const [sku, qty] of required) {
      if (this.inventory.available(sku) < qty) {
        throw new Error(`Insufficient stock for ${sku}`);
      }
    }

    for (const [sku, qty] of required) {
      this.inventory.remove(sku, qty);
    }

    order.reservations = order.lines.map((line) => ({ sku: line.sku, qty: line.qty }));
    return markReady(order);
  }
}
