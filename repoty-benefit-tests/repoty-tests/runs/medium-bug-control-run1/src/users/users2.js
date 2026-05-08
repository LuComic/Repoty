export function users2(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'users2', value, active: value % 2 === 0 };
}
