export function users5(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'users5', value, active: value % 5 === 0 };
}
