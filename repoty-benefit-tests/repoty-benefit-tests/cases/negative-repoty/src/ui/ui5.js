export function ui5(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'ui5', text, length: text.length };
}
