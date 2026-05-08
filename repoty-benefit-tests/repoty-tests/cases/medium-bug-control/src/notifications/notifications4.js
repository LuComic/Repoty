export function notifications4(input) {
  const value = typeof input === 'number' ? input : String(input ?? '').length;
  return { name: 'notifications4', value, active: value % 4 === 0 };
}
