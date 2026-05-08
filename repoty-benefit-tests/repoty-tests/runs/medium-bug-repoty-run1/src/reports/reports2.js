export function reports2(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'reports2', value, active: value % 2 === 0 };
}
