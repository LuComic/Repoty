export function layout5(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'layout5', text, length: text.length };
}
