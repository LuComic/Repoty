export function theme2(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'theme2', text, length: text.length };
}
