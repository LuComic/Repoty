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
