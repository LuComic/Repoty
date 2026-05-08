import { markReady } from '../orders/order.js';

export class FulfillmentService {
  constructor(inventory) { this.inventory = inventory; }

  prepare(order) {
    order.reservations = order.lines.map((line) => ({ sku: line.sku, qty: line.qty }));
    return markReady(order);
  }
}
