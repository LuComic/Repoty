export function theme4(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'theme4', text, length: text.length };
}
