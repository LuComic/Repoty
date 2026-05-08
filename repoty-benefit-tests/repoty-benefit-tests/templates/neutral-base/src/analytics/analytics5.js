export function analytics5(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'analytics5-' + index, item }));
}
