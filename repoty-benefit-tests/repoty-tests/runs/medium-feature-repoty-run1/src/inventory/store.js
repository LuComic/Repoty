export class InventoryStore {
  constructor(initial = {}) { this.stock = new Map(Object.entries(initial)); }
  available(sku) { return this.stock.get(sku) ?? 0; }
  add(sku, qty) { this.stock.set(sku, this.available(sku) + qty); }
  remove(sku, qty) { if (this.available(sku) < qty) return false; this.stock.set(sku, this.available(sku) - qty); return true; }
}
