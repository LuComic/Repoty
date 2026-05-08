export function reports4(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'reports4-' + index, item }));
}
