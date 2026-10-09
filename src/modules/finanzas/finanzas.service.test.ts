import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFinanceSummary, validateFinanceMovement } from './finanzas.service';

test('valida un movimiento de ingreso correcto', () => {
  const result = validateFinanceMovement({
    type: 'ingreso',
    category: 'guardamuebles',
    amount: 15000,
    date: '2026-10-05',
    description: 'Cobro de alquiler'
  });

  assert.equal(result.type, 'ingreso');
  assert.equal(result.category, 'guardamuebles');
  assert.equal(result.amount, 15000);
  assert.equal(result.description, 'Cobro de alquiler');
});

test('rechaza categoría incompatible con el tipo', () => {
  assert.throws(() => {
    validateFinanceMovement({
      type: 'ingreso',
      category: 'combustible',
      amount: 1500,
      date: '2026-10-05',
      description: 'Error'
    });
  }, /categoría/i);
});

test('rechaza montos inválidos', () => {
  assert.throws(() => {
    validateFinanceMovement({
      type: 'egreso',
      category: 'combustible',
      amount: 0,
      date: '2026-10-05',
      description: 'Error'
    });
  }, /mayor a 0/i);
});

test('agrega resumen general para ingresos y egresos', () => {
  const result = buildFinanceSummary([
    { type: 'ingreso', amount: 65000 },
    { type: 'egreso', amount: 23000 },
    { type: 'ingreso', amount: 5000 }
  ] as any);

  assert.deepEqual(result, {
    ingresos: 70000,
    egresos: 23000,
    total: 47000
  });
});
