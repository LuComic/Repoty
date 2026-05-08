export function projects5(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: 'projects5-' + index, item }));
}
