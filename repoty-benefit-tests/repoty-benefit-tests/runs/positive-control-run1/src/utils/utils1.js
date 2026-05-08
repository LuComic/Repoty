export function utils1(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.filter(Boolean).map((item, index) => ({ key: 'utils1-' + index, item }));
}
