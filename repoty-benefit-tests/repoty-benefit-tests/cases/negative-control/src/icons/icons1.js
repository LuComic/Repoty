export function icons1(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'icons1', text, length: text.length };
}
