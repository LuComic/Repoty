export function projects4(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'projects4-' + index, item }));
}
