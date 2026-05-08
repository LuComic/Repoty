export function users5(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'users5-' + index, item }));
}
