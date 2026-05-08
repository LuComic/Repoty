export function inventory3(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'inventory-3-' + index, item }));
}
