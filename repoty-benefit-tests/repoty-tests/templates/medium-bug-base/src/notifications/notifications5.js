export function notifications5(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'notifications5', value, active: value % 5 === 0 };
}
