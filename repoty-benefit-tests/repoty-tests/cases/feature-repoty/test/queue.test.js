import test from 'node:test';
import assert from 'node:assert/strict';
import { TicketQueue, createTicket } from '../src/index.js';

test('next returns the highest priority open ticket', () => {
  const queue = new TicketQueue();
  queue.add(createTicket('a', 'docs typo', 'low'));
  queue.add(createTicket('b', 'payment broken', 'urgent'));
  queue.add(createTicket('c', 'slow report', 'high'));
  assert.equal(queue.next().id, 'b');
});

test('closed urgent tickets are skipped and high priority wins over normal', () => {
  const queue = new TicketQueue();
  queue.add(createTicket('a', 'normal thing', 'normal'));
  queue.add(createTicket('b', 'urgent thing', 'urgent'));
  queue.add(createTicket('c', 'high thing', 'high'));
  queue.close('b');
  assert.equal(queue.next().id, 'c');
});
