import { useState } from 'react';
import { useDS } from '../../hooks/useDS';
import { usePermission } from '../../hooks/usePermission';
import { Card, Btn, Badge, EmptyState } from './legacy';
import { accountStatus, statusColor, totalBalance, money } from './treasuryRules';
import type { Account } from './types';

export default function AccountsTab({ accounts, onPayment }: { accounts: Account[]; onPayment: (account: Account) => void }) {
  const ds = useDS();
  const { can } = usePermission();
  const [filter, setFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const rows = accounts.filter(a => (filter === 'TODOS' || accountStatus(a) === filter)
    && `${a.cliente_proveedor_nombre} ${a.comprobante_referencia}`.toLowerCase().includes(search.toLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / 25));
  const safePage = Math.min(page, pages);
  const currencies = [...new Set(rows.map(a => a.moneda || 'PEN'))];
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-4 items-end">
      <label>Buscar<input className={`block border rounded-xl px-3 py-2 ${ds.inputCls}`} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cliente, proveedor o comprobante" /></label>
      <label>Estado<select className={`block border rounded-xl px-3 py-2 ${ds.inputCls}`} value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>{['TODOS', 'PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO'].map(s => <option key={s}>{s}</option>)}</select></label>
      <p className={`ml-auto text-sm ${ds.muted}`}>Saldo {accounts[0]?.tipo === 'POR_PAGAR' ? 'por pagar' : 'por cobrar'}: <strong className={ds.text}>{currencies.length ? currencies.map(currency => money(totalBalance(rows.filter(a => (a.moneda || 'PEN') === currency)), currency)).join(' · ') : money(0)}</strong></p>
    </div>
    <Card className="overflow-x-auto" padding="none">
      {!rows.length ? <EmptyState title="Sin cuentas con estos filtros" /> : <table className="w-full text-sm text-left min-w-[850px]">
        <thead className={ds.muted}><tr>{['Cliente / Proveedor', 'Comprobante', 'Moneda', 'Total', 'Pagado', 'Saldo', 'Vencimiento', 'Estado', 'Acción'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead>
        <tbody>{rows.slice((safePage - 1) * 25, safePage * 25).map(account => {
          const status = accountStatus(account);
          return <tr key={account.id} className={`border-t ${ds.divider}`}>
            <td className="p-3">{account.cliente_proveedor_nombre}</td><td className="p-3">{account.comprobante_referencia}</td><td className="p-3">{account.moneda || 'PEN'}</td>
            {[account.monto_total, account.monto_pagado, account.saldo_pendiente].map((amount, i) => <td key={i} className="p-3 text-right whitespace-nowrap">{money(amount, account.moneda)}</td>)}
            <td className="p-3">{account.fecha_vencimiento}</td><td className="p-3"><Badge color={statusColor[status]}>{status}</Badge></td>
            <td className="p-3">{can(account.tipo === 'POR_COBRAR' ? 'tesoreria_cxc' : 'tesoreria_cxp', 'EDITAR') && <Btn size="sm" disabled={status === 'PAGADO' || status === 'ANULADO'} onClick={() => onPayment(account)}>{account.tipo === 'POR_COBRAR' ? 'Registrar abono' : 'Pagar cuota'}</Btn>}</td>
          </tr>;
        })}</tbody>
      </table>}
    </Card>
    <div className="flex justify-end items-center gap-3"><span>{rows.length} registros · {safePage} / {pages}</span><Btn variant="secondary" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Anterior</Btn><Btn variant="secondary" disabled={safePage === pages} onClick={() => setPage(safePage + 1)}>Siguiente</Btn></div>
  </div>;
}
