export function forms2(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'forms2', text, length: text.length };
}
