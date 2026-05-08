export const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export function needsReminder(invoice, now) {
  if (invoice.status !== 'open') return false;
  if (!invoice.customerEmail) return false;
  if (invoice.dueAt <= now) return false;
  if (invoice.dueAt - now > REMINDER_WINDOW_MS) return false;
  if (!invoice.reminder) return true;
  return invoice.reminder.dueAt !== invoice.dueAt;
}
