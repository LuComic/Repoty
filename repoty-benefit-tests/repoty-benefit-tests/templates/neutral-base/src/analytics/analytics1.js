export function analytics1(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'analytics1-' + index, item }));
}
