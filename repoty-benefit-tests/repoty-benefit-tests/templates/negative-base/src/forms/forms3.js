export function forms3(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'forms3', text, length: text.length };
}
