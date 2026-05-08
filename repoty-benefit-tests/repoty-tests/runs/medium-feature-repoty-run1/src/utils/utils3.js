export function utils3(input) {
  const list = Array.isArray(input) ? input : [input];
  return list.filter(Boolean).map((item, index) => ({ id: 'utils-3-' + index, item }));
}
