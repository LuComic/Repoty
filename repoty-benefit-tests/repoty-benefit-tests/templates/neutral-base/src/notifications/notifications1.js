export function notifications1(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'notifications1-' + index, item }));
}
