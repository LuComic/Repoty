export function docs5(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'docs5', text, length: text.length };
}
