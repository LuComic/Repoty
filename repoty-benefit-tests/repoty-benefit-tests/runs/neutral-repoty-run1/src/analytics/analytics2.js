export function analytics2(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'analytics2-' + index, item }));
}
