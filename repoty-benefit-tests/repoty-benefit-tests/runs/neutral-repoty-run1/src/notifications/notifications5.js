export function notifications5(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'notifications5-' + index, item }));
}
