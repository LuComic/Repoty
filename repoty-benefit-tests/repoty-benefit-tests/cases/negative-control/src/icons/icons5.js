export function icons5(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'icons5', text, length: text.length };
}
