export function createTicket(id, title, priority = 'normal') {
  if (!['low', 'normal', 'high', 'urgent'].includes(priority)) throw new Error('Invalid priority');
  return { id, title, priority, createdAt: Date.now(), closed: false };
}
