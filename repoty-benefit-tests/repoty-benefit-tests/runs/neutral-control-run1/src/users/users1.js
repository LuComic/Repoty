export function users1(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'users1-' + index, item }));
}
