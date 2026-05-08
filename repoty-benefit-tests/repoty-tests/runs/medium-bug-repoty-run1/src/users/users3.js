export function users3(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'users3', value, active: value % 3 === 0 };
}
