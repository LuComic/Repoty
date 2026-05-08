export function analytics3(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'analytics-3-' + index, item }));
}
