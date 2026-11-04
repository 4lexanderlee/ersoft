import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FaPlus, FaMoneyBillWave, FaReceipt, FaUniversity, FaSync, FaChartPie } from 'react-icons/fa';
import { useDS } from '../../hooks/useDS';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../context/AuthContext';
import { getBranches } from '../../utils/businessData';
import NuevaCxPModal from '../rendiciones/NuevaCxPModal';
import GastoRendicionModal from '../rendiciones/GastoRendicionModal';
import ProfitLossReportPage from '../../pages/finanzas/ProfitLossReportPage';
import { Btn, Card, PageHeader, EmptyState, useTreasury } from './legacy';
import TreasuryKpis from './TreasuryKpis';
import ReceivablesTab from './ReceivablesTab';
import PayablesTab from './PayablesTab';
import ExpenseReportsTab from './ExpenseReportsTab';
import InitialBalanceTab from './InitialBalanceTab';
import PaymentModal from './PaymentModal';
import { accountStatus, money } from './treasuryRules';
import { tabModule } from './types';
import type { TreasuryTab, Account, AccountReceivable, AccountPayable, Role } from './types';

const tabs: { key: TreasuryTab; label: string }[] = [
  { key: 'cxc', label: 'Cuentas por cobrar (CXC)' }, { key: 'cxp', label: 'Cuentas por pagar (CXP)' },
  { key: 'gastos', label: 'Rendiciones de gasto' }, { key: 'balance', label: 'Balance inicial' },
  { key: 'pnl', label: 'Estado de Resultados (P&L)' },
];
export default function TreasuryView() {
  const { user } = useAuth();
  const { can, effectiveSucursalId } = usePermission();
  const role: Role | undefined = user?.rol;
  if (!can('rendiciones_cxc_cxp', 'VER')) return <Navigate to="/principal" replace />;
  return <TreasuryContent key={`${user?.id}:${role}:${effectiveSucursalId}`} />;
}
function TreasuryContent() {
  const ds = useDS();
  const navigate = useNavigate();
  const { can, isGlobalScope, effectiveSucursalId } = usePermission();
  const { cuentasCobrarPagar, rendicionesGastos, balancesIniciales, refreshFinanzas } = useTreasury();
  const [tab, setTab] = useState<TreasuryTab>('cxc');
  const [branch, setBranch] = useState('TODAS');
  const [creating, setCreating] = useState(false);
  const [payment, setPayment] = useState<Account | null>(null);
  const allowedTabs = tabs.filter(t => can(tabModule[t.key], 'VER'));
  const active = allowedTabs.find(t => t.key === tab)?.key || allowedTabs[0]?.key;
  const branchId = isGlobalScope ? branch : String(effectiveSucursalId ?? '');
  const inScope = (row: { sucursal_id: string | number }) => (isGlobalScope && branchId === 'TODAS') || String(row.sucursal_id) === branchId;
  const accounts = cuentasCobrarPagar.filter(a => inScope(a) && a.estado !== 'ANULADO');
  const receivables = accounts.filter((a): a is AccountReceivable => a.tipo === 'POR_COBRAR');
  const payables = accounts.filter((a): a is AccountPayable => a.tipo === 'POR_PAGAR');
  const actions: Partial<Record<TreasuryTab, { label: string; Icon: typeof FaPlus; permission: string }>> = {
    cxc: { label: 'Registrar cobro / abono', Icon: FaMoneyBillWave, permission: 'EDITAR' },
    cxp: { label: 'Nueva cuenta por pagar (Proveedor)', Icon: FaPlus, permission: 'CREAR' },
    gastos: { label: 'Nueva solicitud / rendición', Icon: FaReceipt, permission: 'CREAR' },
    balance: { label: 'Registrar asiento inicial', Icon: FaUniversity, permission: 'CREAR' },
  };
  if (!active) return <EmptyState title="Sin acceso a Tesorería" />;
  const action = actions[active];
  const canCreate = Boolean(action && can(tabModule[active], action.permission));
  const payableAccounts = receivables.filter(a => !['PAGADO', 'ANULADO'].includes(accountStatus(a)));
  return <div className={`-m-6 min-h-full ${ds.isDark ? 'bg-slate-900' : ds.pageBg} ${ds.text}`}>
    <PageHeader onBack={() => navigate('/principal')} right={<div className="flex flex-wrap gap-2">
      {can('estado_resultados', 'VER') && (
        <Btn variant="secondary" leftIcon={<FaChartPie />} onClick={() => navigate('/finanzas/estado-resultados')}>
          Estado de Resultados (P&L)
        </Btn>
      )}
      {canCreate && action && <Btn leftIcon={<action.Icon />} disabled={active === 'balance' && branchId === 'TODAS'} title={active === 'balance' && branchId === 'TODAS' ? 'Selecciona una sucursal para registrar el asiento' : undefined} onClick={() => setCreating(true)}>{action.label}</Btn>}
      <Btn variant="icon" aria-label="Actualizar tesorería" onClick={refreshFinanzas}><FaSync /></Btn>
    </div>} />
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-xl font-bold">Tesorería y Finanzas</h1><p className={`text-sm ${ds.muted}`}>Cobros, obligaciones, patrimonio de apertura y Estado de Resultados (P&L)</p></div>
        <label>Sucursal<select aria-label="Sucursal de tesorería" className={`block border rounded-xl px-3 py-2 ${ds.inputCls}`} value={branchId} disabled={!isGlobalScope} onChange={e => { setBranch(e.target.value); setCreating(false); setPayment(null); }}>
          {isGlobalScope && <option value="TODAS">Todas las sucursales</option>}
          {(getBranches() as { id: string | number; nombre?: string; nombreComercial?: string }[]).filter(b => isGlobalScope || String(b.id) === String(effectiveSucursalId)).map(b => <option key={b.id} value={b.id}>{b.nombre || b.nombreComercial}</option>)}
        </select></label>
      </div>
      <TreasuryKpis accounts={accounts} expenses={rendicionesGastos.filter(inScope)} balances={balancesIniciales.filter(inScope)} />
      <div role="tablist" aria-label="Tesorería" className={`flex overflow-x-auto border-b ${ds.divider}`}>{allowedTabs.map(t => <button key={t.key} role="tab" id={`tab-${t.key}`} aria-controls="treasury-panel" aria-selected={active === t.key} className={`px-4 py-3 uppercase text-sm font-bold whitespace-nowrap border-b-2 ${active === t.key ? 'border-yellow-500 text-yellow-500' : `border-transparent ${ds.muted}`}`} onClick={() => { setTab(t.key); setCreating(false); setPayment(null); }}>{t.label}</button>)}</div>
      <section id="treasury-panel" role="tabpanel" aria-labelledby={`tab-${active}`}>
        {active === 'cxc' && <ReceivablesTab key={branchId} accounts={receivables} onPayment={setPayment} />}
        {active === 'cxp' && <PayablesTab key={branchId} accounts={payables} onPayment={setPayment} />}
        {active === 'gastos' && <ExpenseReportsTab branchId={branchId} />}
        {active === 'balance' && <InitialBalanceTab branchId={branchId} creating={creating && canCreate} onClose={() => setCreating(false)} />}
        {active === 'pnl' && <ProfitLossReportPage embedded initialBranchId={branchId || 'TODAS'} />}
      </section>
    </div>
    {creating && canCreate && active === 'cxc' && <div role="dialog" aria-modal="true" aria-label="Seleccionar cuenta por cobrar" className={`fixed inset-0 z-50 p-4 flex items-center justify-center ${ds.overlayBg}`}><Card className="w-full max-w-xl max-h-[80vh] overflow-y-auto space-y-3"><h2 className="font-bold">Seleccionar comprobante para abonar</h2>{!payableAccounts.length && <EmptyState title="No hay saldos pendientes" />}{payableAccounts.map(a => <Btn key={a.id} variant="secondary" className="w-full justify-between" onClick={() => { setPayment(a); setCreating(false); }}>{a.comprobante_referencia} · {a.cliente_proveedor_nombre} · {money(a.saldo_pendiente, a.moneda)}</Btn>)}<Btn variant="ghost" onClick={() => setCreating(false)}>Cerrar</Btn></Card></div>}
    {creating && canCreate && active === 'cxp' && <NuevaCxPModal branchId={branchId} isOpen onClose={() => setCreating(false)} onSuccess={() => setCreating(false)} />}
    {creating && canCreate && active === 'gastos' && <GastoRendicionModal branchId={branchId} onClose={() => setCreating(false)} onSaved={() => setCreating(false)} />}
    {payment && <PaymentModal account={payment} onClose={() => setPayment(null)} />}
  </div>;
}
