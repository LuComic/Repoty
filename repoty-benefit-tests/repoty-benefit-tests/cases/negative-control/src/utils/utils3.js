export function utils3(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'utils3', text, length: text.length };
}
