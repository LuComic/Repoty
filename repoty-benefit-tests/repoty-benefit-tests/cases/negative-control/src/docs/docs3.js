export function docs3(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'docs3', text, length: text.length };
}
