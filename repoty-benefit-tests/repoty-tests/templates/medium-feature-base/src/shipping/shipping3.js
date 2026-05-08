export function shipping3(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'shipping-3-' + index, item }));
}
