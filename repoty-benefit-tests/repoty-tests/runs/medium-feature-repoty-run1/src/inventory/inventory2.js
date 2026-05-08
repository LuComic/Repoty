export function inventory2(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'inventory-2-' + index, item }));
}
