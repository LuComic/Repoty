export function utils5(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'utils5', text, length: text.length };
}
