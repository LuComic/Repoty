export function icons3(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'icons3', text, length: text.length };
}
