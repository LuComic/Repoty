export function reports1(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'reports1', value, active: value % 1 === 0 };
}
