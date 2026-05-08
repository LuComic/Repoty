export function notifications4(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'notifications4-' + index, item }));
}
