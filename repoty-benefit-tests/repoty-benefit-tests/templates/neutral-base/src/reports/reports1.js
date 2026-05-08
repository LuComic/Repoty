export function reports1(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'reports1-' + index, item }));
}
