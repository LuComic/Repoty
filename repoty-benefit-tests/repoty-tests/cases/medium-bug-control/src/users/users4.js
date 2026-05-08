export function users4(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'users4', value, active: value % 4 === 0 };
}
