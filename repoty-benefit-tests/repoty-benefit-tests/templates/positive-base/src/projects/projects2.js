export function projects2(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.filter(Boolean).map((item, index) => ({ key: 'projects2-' + index, item }));
}
