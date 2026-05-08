export function forms5(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: 'forms5', text, length: text.length };
}
