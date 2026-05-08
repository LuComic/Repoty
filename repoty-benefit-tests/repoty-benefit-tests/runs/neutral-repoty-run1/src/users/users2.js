export function users2(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'users2-' + index, item }));
}
