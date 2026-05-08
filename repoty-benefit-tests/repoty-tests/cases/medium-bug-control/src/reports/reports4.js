export function reports4(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'reports4', value, active: value % 4 === 0 };
}
