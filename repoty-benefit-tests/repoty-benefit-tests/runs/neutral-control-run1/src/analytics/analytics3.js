export function analytics3(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'analytics3-' + index, item }));
}
