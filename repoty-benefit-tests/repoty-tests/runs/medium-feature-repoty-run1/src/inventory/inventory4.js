export function inventory4(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'inventory-4-' + index, item }));
}
