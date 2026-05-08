export function docs1(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'docs1', text, length: text.length };
}
