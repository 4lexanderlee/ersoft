import test from 'node:test';
import assert from 'node:assert/strict';
import { canUseCashSession, findCashSession } from '../src/utils/cashSession.js';
const session = { id: 'CAJA-1', estado: 'Abierto', usuarioId: '1', sucursalId: '2', terminal_id: 'TERM-A', ip_detectada: '10.0.0.1' };
const user = { id: 1, rol: 'CAJERO', sucursal_id: '2' };
test('caja abierta habilita exclusivamente dueño, sucursal y terminal; cerrar la bloquea', () => {
  assert.equal(canUseCashSession(session, user, { terminal_id: 'TERM-A' }, '2'), true);
  assert.equal(canUseCashSession({ ...session, estado: 'Cerrado' }, user, { terminal_id: 'TERM-A' }, '2'), false);
  assert.equal(canUseCashSession(session, { ...user, id: 2 }, { terminal_id: 'TERM-A' }, '2'), false);
  assert.equal(canUseCashSession(session, user, { terminal_id: 'TERM-B', ip_detectada: '10.0.0.1' }, '2'), false);
  assert.equal(canUseCashSession(session, user, { terminal_id: 'TERM-A' }, '1'), false);
  assert.equal(canUseCashSession({ ...session, terminal_id: null }, user, { terminal_id: 'TERM-A' }, '2'), false);
});
test('nunca toma una caja de otra sucursal como respaldo', () => {
  assert.equal(findCashSession([session], '1'), null);
  assert.equal(findCashSession([session], '2'), session);
  assert.equal(findCashSession([{ ...session, estado: 'Cerrado' }], '2'), null);
});
