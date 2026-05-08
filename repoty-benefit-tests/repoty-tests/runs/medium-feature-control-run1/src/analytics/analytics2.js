export function analytics2(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'analytics-2-' + index, item }));
}
