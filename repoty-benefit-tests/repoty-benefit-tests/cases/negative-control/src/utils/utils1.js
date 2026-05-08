export function utils1(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'utils1', text, length: text.length };
}
