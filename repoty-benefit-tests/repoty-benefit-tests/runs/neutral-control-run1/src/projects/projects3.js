export function projects3(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'projects3-' + index, item }));
}
