export function notifications2(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'notifications2', value, active: value % 2 === 0 };
}
