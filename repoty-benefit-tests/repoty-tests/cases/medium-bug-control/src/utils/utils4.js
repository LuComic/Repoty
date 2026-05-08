export function utils4(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'utils4', value, active: value % 4 === 0 };
}
