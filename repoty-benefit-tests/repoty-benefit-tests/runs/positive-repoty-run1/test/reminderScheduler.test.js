import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvoice, planReminderJobs, REMINDER_WINDOW_MS } from '../src/index.js';

const now = Date.UTC(2026, 0, 10, 9, 0, 0);

test('schedules reminders for open invoices due within the reminder window', () => {
  const invoices = [createInvoice('inv-1', now + REMINDER_WINDOW_MS - 1_000, 'a@example.com')];
  const jobs = planReminderJobs(invoices, now);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].invoiceId, 'inv-1');
});

test('does not reschedule reminder when the due date has not changed', () => {
  const dueAt = now + REMINDER_WINDOW_MS - 5_000;
  const invoices = [createInvoice('inv-2', dueAt, 'b@example.com', 'open', { status: 'scheduled', dueAt })];
  const jobs = planReminderJobs(invoices, now);
  assert.equal(jobs.length, 0);
});

test('reschedules reminder when the invoice due date changes inside the reminder window', () => {
  const oldDueAt = now + REMINDER_WINDOW_MS - 5_000;
  const newDueAt = now + REMINDER_WINDOW_MS - 15_000;
  const invoices = [createInvoice('inv-3', newDueAt, 'c@example.com', 'open', { status: 'scheduled', dueAt: oldDueAt })];
  const jobs = planReminderJobs(invoices, now);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].dueAt, newDueAt);
});
