export function utils5(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'utils5', value, active: value % 5 === 0 };
}
