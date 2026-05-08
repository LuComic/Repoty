export function utils3(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'utils3-' + index, item }));
}
