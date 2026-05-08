export function theme3(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'theme3', text, length: text.length };
}
