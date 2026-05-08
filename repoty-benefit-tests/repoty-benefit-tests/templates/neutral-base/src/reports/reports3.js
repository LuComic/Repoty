export function reports3(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'reports3-' + index, item }));
}
