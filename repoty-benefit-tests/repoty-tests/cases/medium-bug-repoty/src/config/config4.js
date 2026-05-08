export function config4(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'config4', value, active: value % 4 === 0 };
}
