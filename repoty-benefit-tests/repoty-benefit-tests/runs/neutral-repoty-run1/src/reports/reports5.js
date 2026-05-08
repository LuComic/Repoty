export function reports5(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'reports5-' + index, item }));
}
