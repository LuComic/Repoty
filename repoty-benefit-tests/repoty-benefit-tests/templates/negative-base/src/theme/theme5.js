export function theme5(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'theme5', text, length: text.length };
}
