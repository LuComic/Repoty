export function analytics4(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'analytics-4-' + index, item }));
}
