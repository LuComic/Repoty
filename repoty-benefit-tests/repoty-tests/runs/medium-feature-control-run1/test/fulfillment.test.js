import test from 'node:test';
import assert from 'node:assert/strict';
import { InventoryStore, FulfillmentService, createOrder } from '../src/index.js';

test('prepare reserves stock and marks order ready', () => {
  const inventory = new InventoryStore({ pen: 3, bag: 1 });
  const service = new FulfillmentService(inventory);
  const order = createOrder('o1', [{ sku: 'pen', qty: 2 }, { sku: 'bag', qty: 1 }]);
  service.prepare(order);
  assert.equal(order.status, 'ready');
  assert.deepEqual(order.reservations, [{ sku: 'pen', qty: 2 }, { sku: 'bag', qty: 1 }]);
  assert.equal(inventory.available('pen'), 1);
  assert.equal(inventory.available('bag'), 0);
});

test('prepare is atomic when stock is insufficient', () => {
  const inventory = new InventoryStore({ pen: 3, bag: 0 });
  const service = new FulfillmentService(inventory);
  const order = createOrder('o2', [{ sku: 'pen', qty: 2 }, { sku: 'bag', qty: 1 }]);
  assert.throws(() => service.prepare(order), /Insufficient stock/);
  assert.equal(order.status, 'new');
  assert.deepEqual(order.reservations, []);
  assert.equal(inventory.available('pen'), 3);
});
