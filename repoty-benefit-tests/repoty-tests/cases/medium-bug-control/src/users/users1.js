export function users1(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'users1', value, active: value % 1 === 0 };
}
