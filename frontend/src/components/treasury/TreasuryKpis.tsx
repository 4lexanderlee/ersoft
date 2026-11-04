import { useDS } from '../../hooks/useDS';
import { usePermission } from '../../hooks/usePermission';
import { Card } from './legacy';
import { money, totalBalance } from './treasuryRules';
import type { Account, ExpenseReport, InitialBalance } from './types';
export default function TreasuryKpis({ accounts, expenses, balances }: { accounts: Account[]; expenses: ExpenseReport[]; balances: InitialBalance[] }) {
  const ds = useDS();
  const { can } = usePermission();
  const sums = (type: Account['tipo']) => {
    const rows = accounts.filter(a => a.tipo === type);
    return [...new Set(rows.map(a => a.moneda || 'PEN'))].map(currency => money(totalBalance(rows.filter(a => (a.moneda || 'PEN') === currency)), currency)).join(' · ') || money(0);
  };
  const metrics = [
    { label: 'Total por cobrar', value: sums('POR_COBRAR'), module: 'tesoreria_cxc' },
    { label: 'Total por pagar', value: sums('POR_PAGAR'), module: 'tesoreria_cxp' },
    { label: 'Rendiciones pendientes', value: String(expenses.filter(r => r.estado === 'PENDIENTE_APROBACION').length), module: 'tesoreria_gastos' },
    { label: 'Patrimonio base', value: money(balances.reduce((sum, b) => sum + Number(b.monto), 0)), module: 'tesoreria_balance' },
  ];
  return <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{metrics.filter(m => can(m.module, 'VER')).map(metric => <Card key={metric.label}><p className={`text-xs uppercase font-bold ${ds.muted}`}>{metric.label}</p><p className={`text-2xl font-bold mt-2 ${ds.text}`}>{metric.value}</p>{metric.module === 'tesoreria_balance' && <p className={`text-xs mt-1 ${ds.muted}`}>Patrimonio de apertura, no ingreso de venta.</p>}</Card>)}</div>;
}
