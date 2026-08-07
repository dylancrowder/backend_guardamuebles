import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeCustomerBoxes } from './customers.service';

test('normaliza un solo box a un arreglo', () => {
  assert.deepEqual(normalizeCustomerBoxes(12), [12]);
});

test('normaliza varios box desde un arreglo', () => {
  assert.deepEqual(normalizeCustomerBoxes([12, 13, 14]), [12, 13, 14]);
});

test('normaliza box desde texto separado por coma', () => {
  assert.deepEqual(normalizeCustomerBoxes('12, 13, 14'), [12, 13, 14]);
});
