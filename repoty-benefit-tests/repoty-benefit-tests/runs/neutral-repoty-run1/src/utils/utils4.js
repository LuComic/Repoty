export function utils4(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'utils4-' + index, item }));
}
