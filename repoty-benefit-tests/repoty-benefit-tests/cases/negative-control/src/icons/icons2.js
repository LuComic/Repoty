export function icons2(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'icons2', text, length: text.length };
}
