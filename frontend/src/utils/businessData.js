export const todayLima = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const money = value => `S/ ${Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const readStored = (key, fallback = []) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
export const getBranches = () => readStored('ersoft_sucursales', [
  { id: '1', nombre: 'Sede Principal' }, { id: '2', nombre: 'Sede Norte' }, { id: '3', nombre: 'Sede Sur' },
]);
export const inBranch = (record, branchId) => branchId === null || (
  branchId !== undefined && branchId !== '' && String(record.sucursal_id ?? record.sucursalId) === String(branchId)
);
export const dayOf = value => value?.length === 10 ? value : value ? new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(value)) : '';
export const inPeriod = (value, from, to) => {
  const day = dayOf(value);
  return Boolean(day) && (!from || day >= from) && (!to || day <= to);
};

// The latest scheduled contact supersedes earlier reminders for that opportunity.
export const pendingContacts = (opportunities, interactions) => opportunities.filter(op => !['GANADO', 'PERDIDO'].includes(op.etapa)).flatMap(op => {
  const history = interactions.filter(s => String(s.oportunidad_id) === String(op.oportunidad_id))
    .sort((a, b) => String(b.fecha_contacto).localeCompare(String(a.fecha_contacto)) || Number(b.id) - Number(a.id));
  const date = history[0]?.fecha_proximo_contacto || op.fecha_proximo_contacto;
  return date ? [{ ...history[0], oportunidad: op, fecha_proximo_contacto: date, sucursal_id: op.sucursal_id }] : [];
});

export const financialSummary = ({ ventas, cuentas, rendiciones, balances, desde = '', hasta = '' }) => {
  const active = ventas.filter(v => !['ANULADO', 'ANULADA'].includes(String(v.estado).toUpperCase()) && inPeriod(v.fecha, desde, hasta));
  const approved = rendiciones.filter(r => r.estado === 'APROBADO' && inPeriod(r.fecha_resolucion || r.fecha_solicitud, desde, hasta));
  const sum = (list, getter) => list.reduce((total, item) => total + Number(getter(item) || 0), 0);
  const netSales = sum(active, v => v.total / 1.18);
  const salesTax = sum(active, v => v.total - v.total / 1.18);
  const cost = sum(active.flatMap(v => v.items || []), item => Number(item.costo || 0) * Number(item.qty || 0));
  const expenses = sum(approved, r => r.tiene_credito_fiscal_igv ? r.monto / 1.18 : r.monto);
  const cashSales = sum(active.filter(v => v.condicion_pago !== 'CREDITO' && v.metodoPago !== 'credit'), v => v.total);
  const cashOnly = sum(active.filter(v => v.condicion_pago !== 'CREDITO' && v.metodoPago === 'cash'), v => v.total);
  const payments = tipo => sum(cuentas.filter(c => c.tipo === tipo).flatMap(c => c.abonos || []).filter(a => inPeriod(a.fecha, desde, hasta)), a => a.monto);
  // Linked expenses/purchases share one tax credit; never count the same invoice twice.
  const expenseRefs = new Set(approved.map(r => r.cuenta_id || r.comprobante_referencia).filter(Boolean));
  const purchases = cuentas.filter(c => c.tipo === 'POR_PAGAR' && c.tiene_credito_fiscal_igv && inPeriod(c.fecha_emision, desde, hasta)
    && !expenseRefs.has(c.id) && !expenseRefs.has(c.comprobante_referencia));
  const taxCredit = sum(approved.filter(r => r.tiene_credito_fiscal_igv), r => r.monto - r.monto / 1.18)
    + sum(purchases, c => c.monto_igv ?? (c.monto_total - c.monto_total / 1.18));
  const opening = balances.filter(b => !hasta || dayOf(b.fecha) <= hasta);
  return { netSales, salesTax, cost, expenses, profit: netSales - cost - expenses,
    cashSales, cashOnly, collected: payments('POR_COBRAR'), paid: payments('POR_PAGAR'),
    liquidity: cashSales + payments('POR_COBRAR') - payments('POR_PAGAR'), taxCredit, taxDue: salesTax - taxCredit,
    openingCash: sum(opening.filter(b => b.tipo === 'CAPITAL_CAJA'), b => b.monto),
    openingBank: sum(opening.filter(b => b.tipo === 'CAPITAL_BANCO'), b => b.monto),
    openingInventory: sum(opening.filter(b => b.tipo === 'INVENTARIO_APERTURA'), b => b.monto) };
};
