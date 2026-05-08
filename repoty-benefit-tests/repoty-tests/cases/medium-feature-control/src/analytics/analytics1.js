export function analytics1(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'analytics-1-' + index, item }));
}
