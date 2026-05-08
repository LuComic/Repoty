export function utils4(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'utils-4-' + index, item }));
}
