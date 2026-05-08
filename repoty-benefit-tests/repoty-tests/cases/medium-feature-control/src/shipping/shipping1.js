export function shipping1(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'shipping-1-' + index, item }));
}
