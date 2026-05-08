export function config2(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'config2', value, active: value % 2 === 0 };
}
