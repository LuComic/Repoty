export function forms1(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'forms1', text, length: text.length };
}
