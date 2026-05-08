export function docs2(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'docs2', text, length: text.length };
}
