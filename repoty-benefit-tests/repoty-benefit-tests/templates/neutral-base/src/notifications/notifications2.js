export function notifications2(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'notifications2-' + index, item }));
}
