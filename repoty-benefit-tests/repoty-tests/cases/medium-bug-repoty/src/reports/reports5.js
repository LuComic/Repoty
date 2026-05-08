export function reports5(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'reports5', value, active: value % 5 === 0 };
}
