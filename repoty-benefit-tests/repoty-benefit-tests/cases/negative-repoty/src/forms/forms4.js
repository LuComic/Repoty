export function forms4(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'forms4', text, length: text.length };
}
