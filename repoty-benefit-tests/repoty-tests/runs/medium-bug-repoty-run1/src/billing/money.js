export function roundCents(value) { return Math.round(value); }
export function formatCents(cents) { return `$${(cents / 100).toFixed(2)}`; }
export function clampNonNegative(cents) { return Math.max(0, roundCents(cents)); }
