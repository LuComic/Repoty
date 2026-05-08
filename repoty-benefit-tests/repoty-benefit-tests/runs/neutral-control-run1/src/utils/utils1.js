export function utils1(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'utils1-' + index, item }));
}
