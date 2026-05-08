export function buildReminderJob(invoice) {
  return {
    kind: 'invoice-reminder',
    invoiceId: invoice.id,
    to: invoice.customerEmail,
    dueAt: invoice.dueAt,
  };
}
