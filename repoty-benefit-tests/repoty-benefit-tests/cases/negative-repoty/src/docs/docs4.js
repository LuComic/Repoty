export function docs4(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'docs4', text, length: text.length };
}
