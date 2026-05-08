export function ui2(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'ui2', text, length: text.length };
}
