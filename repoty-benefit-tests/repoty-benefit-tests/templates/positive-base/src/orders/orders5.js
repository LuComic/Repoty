export function orders5(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.filter(Boolean).map((item, index) => ({ key: 'orders5-' + index, item }));
}
