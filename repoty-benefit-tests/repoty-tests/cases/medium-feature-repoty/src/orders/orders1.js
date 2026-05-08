export function orders1(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'orders-1-' + index, item }));
}
