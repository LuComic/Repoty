export function ui3(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'ui3', text, length: text.length };
}
