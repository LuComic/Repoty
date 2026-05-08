export function inventory1(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'inventory-1-' + index, item }));
}
