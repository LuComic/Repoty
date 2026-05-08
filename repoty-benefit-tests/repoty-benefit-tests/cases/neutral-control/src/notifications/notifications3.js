export function notifications3(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'notifications3-' + index, item }));
}
