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
