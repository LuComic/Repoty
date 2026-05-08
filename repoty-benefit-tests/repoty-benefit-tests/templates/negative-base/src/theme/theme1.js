export function theme1(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'theme1', text, length: text.length };
}
