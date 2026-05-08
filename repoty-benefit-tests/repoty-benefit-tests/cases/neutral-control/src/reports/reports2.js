export function reports2(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'reports2-' + index, item }));
}
