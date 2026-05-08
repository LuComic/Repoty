export function icons4(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'icons4', text, length: text.length };
}
