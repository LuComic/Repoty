export function layout4(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'layout4', text, length: text.length };
}
