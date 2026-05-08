export function shipping2(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'shipping-2-' + index, item }));
}
