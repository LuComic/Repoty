export function orders6(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.filter(Boolean).map((item, index) => ({ key: 'orders6-' + index, item }));
}
