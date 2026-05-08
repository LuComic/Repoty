export function layout1(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'layout1', text, length: text.length };
}
