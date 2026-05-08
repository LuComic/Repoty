export function layout3(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'layout3', text, length: text.length };
}
