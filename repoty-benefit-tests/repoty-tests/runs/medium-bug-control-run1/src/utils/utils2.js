export function utils2(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'utils2', value, active: value % 2 === 0 };
}
