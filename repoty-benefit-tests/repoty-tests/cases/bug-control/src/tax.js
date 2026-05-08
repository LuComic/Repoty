export function calculateTax(amount, rate = 0.2) {
  return roundMoney(amount * rate);
}

export function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
