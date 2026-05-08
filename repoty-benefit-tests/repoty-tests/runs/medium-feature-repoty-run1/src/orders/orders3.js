export function orders3(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'orders-3-' + index, item }));
}
