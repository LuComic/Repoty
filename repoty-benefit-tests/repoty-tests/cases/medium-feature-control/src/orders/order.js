export function createOrder(id, lines) { return { id, lines, status: 'new', reservations: [] }; }
export function markReady(order) { order.status = 'ready'; return order; }
