#!/usr/bin/env bash
set -euo pipefail
rm -rf templates cases runs results
mkdir -p templates/positive-base/src/{billing,notifications,projects,users,reports,orders,utils} templates/positive-base/test
mkdir -p templates/negative-base/src/{ui,theme,icons,docs,forms,layout,utils} templates/negative-base/test
mkdir -p templates/neutral-base/src/{projects,search,users,analytics,notifications,utils,reports} templates/neutral-base/test
mkdir -p results/raw

cat > templates/positive-base/package.json <<'JSON'
{"name":"repoty-positive-case","version":"1.0.0","type":"module","scripts":{"test":"node --test"}}
JSON
cat > templates/positive-base/README.md <<'MD'
# Dispatch Hub

A small operations backend for invoices, reminders, projects, and reporting.
There is a reminder scheduling bug triggered by due date changes.
MD
cat > templates/positive-base/src/billing/invoiceModel.js <<'JS'
export function createInvoice(id, dueAt, customerEmail, status = 'open', reminder = null) {
  return { id, dueAt, customerEmail, status, reminder };
}
JS
cat > templates/positive-base/src/notifications/reminderPolicy.js <<'JS'
export const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export function needsReminder(invoice, now) {
  if (invoice.status !== 'open') return false;
  if (!invoice.customerEmail) return false;
  if (invoice.dueAt <= now) return false;
  if (invoice.dueAt - now > REMINDER_WINDOW_MS) return false;
  if (!invoice.reminder) return true;
  // BUG: invoices whose due date changed still need a new reminder scheduled.
  return false;
}
JS
cat > templates/positive-base/src/notifications/jobBuilder.js <<'JS'
export function buildReminderJob(invoice) {
  return {
    kind: 'invoice-reminder',
    invoiceId: invoice.id,
    to: invoice.customerEmail,
    dueAt: invoice.dueAt,
  };
}
JS
cat > templates/positive-base/src/notifications/scheduler.js <<'JS'
import { needsReminder } from './reminderPolicy.js';
import { buildReminderJob } from './jobBuilder.js';

export function planReminderJobs(invoices, now) {
  return invoices.filter((invoice) => needsReminder(invoice, now)).map(buildReminderJob);
}
JS
cat > templates/positive-base/src/index.js <<'JS'
export { createInvoice } from './billing/invoiceModel.js';
export { needsReminder, REMINDER_WINDOW_MS } from './notifications/reminderPolicy.js';
export { planReminderJobs } from './notifications/scheduler.js';
JS
cat > templates/positive-base/test/reminderScheduler.test.js <<'JS'
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
JS
for dir in projects users reports orders utils; do for i in 1 2 3 4 5 6; do cat > templates/positive-base/src/$dir/${dir}${i}.js <<JS
export function ${dir}${i}(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.filter(Boolean).map((item, index) => ({ key: '${dir}${i}-' + index, item }));
}
JS
done; done

cat > templates/negative-base/package.json <<'JSON'
{"name":"repoty-negative-case","version":"1.0.0","type":"module","scripts":{"test":"node --test"}}
JSON
cat > templates/negative-base/README.md <<'MD'
# UI Lab

A component styling library with badge, button, form, and layout helpers.
Feature request: add an xs badge size in `src/ui/badge.js`.
MD
cat > templates/negative-base/src/ui/badge.js <<'JS'
const SIZE_CLASSES = {
  sm: 'h-5 px-2 text-xs',
  md: 'h-6 px-2.5 text-sm',
  lg: 'h-7 px-3 text-sm'
};

export function badgeClass(size = 'md') {
  return SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
}

export function renderBadge(label, size = 'md') {
  return `<span class="badge ${badgeClass(size)}">${label}</span>`;
}
JS
cat > templates/negative-base/src/index.js <<'JS'
export { badgeClass, renderBadge } from './ui/badge.js';
JS
cat > templates/negative-base/test/badge.test.js <<'JS'
import test from 'node:test';
import assert from 'node:assert/strict';
import { badgeClass, renderBadge } from '../src/index.js';

test('badgeClass supports the new xs size', () => {
  assert.equal(badgeClass('xs'), 'h-4 px-1.5 text-[10px]');
});

test('renderBadge includes the xs size classes', () => {
  const html = renderBadge('New', 'xs');
  assert.match(html, /h-4 px-1.5 text-\[10px\]/);
});
JS
for dir in theme icons docs forms layout utils ui; do for i in 1 2 3 4 5; do if [ "$dir/$i" != "ui/1" ]; then cat > templates/negative-base/src/$dir/${dir}${i}.js <<JS
export function ${dir}${i}(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return { name: '${dir}${i}', text, length: text.length };
}
JS
fi; done; done

cat > templates/neutral-base/package.json <<'JSON'
{"name":"repoty-neutral-case","version":"1.0.0","type":"module","scripts":{"test":"node --test"}}
JSON
cat > templates/neutral-base/README.md <<'MD'
# Team Workspace

A project workspace backend with project search, notifications, analytics, and reports.
Feature request: support archived filtering in project search.
MD
cat > templates/neutral-base/src/projects/store.js <<'JS'
export function createProject(id, name, archived = false, tags = []) {
  return { id, name, archived, tags };
}
JS
cat > templates/neutral-base/src/search/filters.js <<'JS'
export function normalizeProjectSearchFilters(filters = {}) {
  return {
    text: typeof filters.text === 'string' ? filters.text.trim().toLowerCase() : '',
    archived: filters.archived === 'all' ? 'all' : 'active',
  };
}
JS
cat > templates/neutral-base/src/search/queryProjects.js <<'JS'
import { normalizeProjectSearchFilters } from './filters.js';

export function queryProjects(projects, filters = {}) {
  const normalized = normalizeProjectSearchFilters(filters);
  return projects.filter((project) => {
    if (normalized.text && !project.name.toLowerCase().includes(normalized.text)) {
      return false;
    }
    // TODO: support archived filtering.
    return true;
  });
}
JS
cat > templates/neutral-base/src/index.js <<'JS'
export { createProject } from './projects/store.js';
export { normalizeProjectSearchFilters } from './search/filters.js';
export { queryProjects } from './search/queryProjects.js';
JS
cat > templates/neutral-base/test/projectSearch.test.js <<'JS'
import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, queryProjects } from '../src/index.js';

const projects = [
  createProject('p1', 'Alpha Board', false),
  createProject('p2', 'Archive Alpha', true),
  createProject('p3', 'Beta Space', false),
];

test('default search excludes archived projects', () => {
  const result = queryProjects(projects, { text: 'alpha' });
  assert.deepEqual(result.map((project) => project.id), ['p1']);
});

test('archived: all includes archived matches too', () => {
  const result = queryProjects(projects, { text: 'alpha', archived: 'all' });
  assert.deepEqual(result.map((project) => project.id), ['p1', 'p2']);
});
JS
for dir in users analytics notifications utils reports projects; do for i in 1 2 3 4 5; do if [ "$dir/$i" != "projects/1" ]; then cat > templates/neutral-base/src/$dir/${dir}${i}.js <<JS
export function ${dir}${i}(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({ id: '${dir}${i}-' + index, item }));
}
JS
fi; done; done

mkdir -p cases
for case in positive negative neutral; do
  for cond in control repoty; do
    cp -R "templates/${case}-base" "cases/${case}-${cond}"
  done
done
