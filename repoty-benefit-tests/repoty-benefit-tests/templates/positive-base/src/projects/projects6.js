export function projects6(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.filter(Boolean).map((item, index) => ({ key: 'projects6-' + index, item }));
}
