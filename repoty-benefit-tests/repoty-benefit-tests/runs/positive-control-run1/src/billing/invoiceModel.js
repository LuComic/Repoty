export function createInvoice(id, dueAt, customerEmail, status = 'open', reminder = null) {
  return { id, dueAt, customerEmail, status, reminder };
}
