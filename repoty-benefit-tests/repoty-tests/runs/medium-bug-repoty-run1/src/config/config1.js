export function config1(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'config1', value, active: value % 1 === 0 };
}
