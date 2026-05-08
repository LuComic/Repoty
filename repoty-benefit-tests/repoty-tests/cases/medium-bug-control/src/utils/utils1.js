export function utils1(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'utils1', value, active: value % 1 === 0 };
}
