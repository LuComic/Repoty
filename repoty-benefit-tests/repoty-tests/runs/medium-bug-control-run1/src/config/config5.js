export function config5(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'config5', value, active: value % 5 === 0 };
}
