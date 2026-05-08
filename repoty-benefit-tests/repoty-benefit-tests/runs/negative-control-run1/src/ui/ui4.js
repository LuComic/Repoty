export function ui4(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'ui4', text, length: text.length };
}
