import { needsReminder } from './reminderPolicy.js';
import { buildReminderJob } from './jobBuilder.js';

export function planReminderJobs(invoices, now) {
  return invoices.filter((invoice) => needsReminder(invoice, now)).map(buildReminderJob);
}
