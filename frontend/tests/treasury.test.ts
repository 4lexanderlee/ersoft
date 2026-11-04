import test from 'node:test';
import assert from 'node:assert/strict';
import { accountStatus, totalBalance } from '../src/components/treasury/treasuryRules.ts';
import type { AccountReceivable } from '../src/components/treasury/types.ts';
import { RBAC_MATRIX } from '../src/data/rbacMatrix.js';

const base: AccountReceivable = { id: 1, tipo: 'POR_COBRAR', cliente_proveedor_nombre: 'Cliente', comprobante_referencia: 'NV01-1', concepto: 'Venta', sucursal_id: '1', monto_total: 100, monto_pagado: 0, saldo_pendiente: 100, moneda: 'PEN', fecha_emision: '2026-01-01', fecha_vencimiento: '2026-12-31', estado: 'PENDIENTE', abonos: [] };
test('estado de cuenta respeta saldo, pagos, vencimiento y anulación', () => {
  assert.equal(accountStatus(base, '2026-11-04'), 'PENDIENTE');
  assert.equal(accountStatus({ ...base, monto_pagado: 20, saldo_pendiente: 80 }, '2026-11-04'), 'PARCIAL');
  assert.equal(accountStatus(base, '2027-01-01'), 'VENCIDO');
  assert.equal(accountStatus({ ...base, saldo_pendiente: 0 }, '2027-01-01'), 'PAGADO');
  assert.equal(accountStatus({ ...base, estado: 'ANULADO', saldo_pendiente: 0 }, '2027-01-01'), 'ANULADO');
});
test('saldo filtrado coincide con la suma monetaria sin error de coma flotante', () => {
  assert.equal(totalBalance([{ ...base, saldo_pendiente: 0.1 }, { ...base, saldo_pendiente: 0.2 }]), 0.3);
  assert.equal(totalBalance([]), 0);
});
test('cajero solo opera CxC; almacenero no accede a Tesorería', () => {
  assert.equal(RBAC_MATRIX.CAJERO.permissions.tesoreria_cxc.EDITAR, true);
  for (const module of ['tesoreria_cxp', 'tesoreria_gastos', 'tesoreria_balance']) assert.equal(RBAC_MATRIX.CAJERO.permissions[module].VER, false);
  assert.equal(RBAC_MATRIX.ALMACENERO.permissions.rendiciones_cxc_cxp.VER, false);
  for (const role of ['MASTER', 'ADMINISTRADOR']) for (const module of ['tesoreria_cxc', 'tesoreria_cxp', 'tesoreria_gastos', 'tesoreria_balance']) assert.equal(RBAC_MATRIX[role].permissions[module].EDITAR, true);
});
