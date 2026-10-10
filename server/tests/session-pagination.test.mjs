import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSessionPagination } from '../dist/controllers/authController.js';

test('session pagination defaults and accepts bounded values', () => {
  assert.deepEqual(parseSessionPagination({}), { page: 1, limit: 20 });
  assert.deepEqual(parseSessionPagination({ page: '10000', limit: '100' }), {
    page: 10000,
    limit: 100,
  });
});

test('session pagination rejects invalid, oversized, repeated, and unexpected values', () => {
  for (const query of [
    { page: '0' },
    { page: '10001' },
    { limit: '101' },
    { page: '1.5' },
    { page: ['1', '2'] },
    { offset: '0' },
  ]) {
    assert.throws(() => parseSessionPagination(query), { statusCode: 400 });
  }
});
