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

    const reserved = [];

    try {
      for (const [sku, qty] of required) {
        if (!this.inventory.remove(sku, qty)) {
          throw new Error(`Insufficient stock for ${sku}`);
        }
        reserved.push({ sku, qty });
      }
    } catch (error) {
      for (const reservation of reserved) {
        this.inventory.add(reservation.sku, reservation.qty);
      }
      throw error;
    }

    order.reservations = order.lines.map((line) => ({ sku: line.sku, qty: line.qty }));
    return markReady(order);
  }
}
