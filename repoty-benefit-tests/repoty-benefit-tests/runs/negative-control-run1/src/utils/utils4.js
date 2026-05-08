export function utils4(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'utils4', text, length: text.length };
}
