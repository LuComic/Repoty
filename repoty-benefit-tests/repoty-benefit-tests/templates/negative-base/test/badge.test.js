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
