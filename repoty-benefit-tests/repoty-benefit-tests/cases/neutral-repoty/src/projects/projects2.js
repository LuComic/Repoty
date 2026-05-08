export function projects2(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'projects2-' + index, item }));
}
