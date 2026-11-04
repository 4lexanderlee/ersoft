import { useEffect, useRef, useState } from 'react';
import { useDS } from '../../hooks/useDS';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../context/AuthContext';
import { Btn, useTreasury } from './legacy';
import { money, accountStatus } from './treasuryRules';
import type { Account } from './types';

export default function PaymentModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const ds = useDS();
  const { can, isGlobalScope, effectiveSucursalId } = usePermission();
  const { user } = useAuth();
  const { cuentasCobrarPagar, registrarAbonoCuenta } = useTreasury();
  const current = cuentasCobrarPagar.find(row => row.id === account.id) || account;
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Efectivo');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  const allowed = can(current.tipo === 'POR_COBRAR' ? 'tesoreria_cxc' : 'tesoreria_cxp', 'EDITAR')
    && (isGlobalScope || String(current.sucursal_id) === String(effectiveSucursalId));
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="payment-title" className={`m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border p-6 backdrop:bg-black/60 ${ds.cardBg} ${ds.text}`}>
    <form className="space-y-4" onSubmit={event => {
      event.preventDefault();
      if (submitting.current) return;
      const value = Number(amount);
      if (!allowed || ['PAGADO', 'ANULADO'].includes(accountStatus(current))) return setError('La cuenta no admite abonos con tu permiso actual.');
      if (!Number.isFinite(value) || value <= 0 || Math.round(value * 100) > Math.round(current.saldo_pendiente * 100)) return setError('Ingresa un monto positivo que no supere el saldo.');
      submitting.current = true;
      try { registrarAbonoCuenta(current.id, { monto: value, metodoPago: method, referencia: reference, usuario: user?.name || 'Usuario' }); onClose(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo registrar el abono.'); submitting.current = false; }
    }}>
      <h2 id="payment-title" className="text-lg font-bold">{current.tipo === 'POR_COBRAR' ? 'Registrar cobro / abono' : 'Registrar pago'}</h2>
      <p>{current.cliente_proveedor_nombre} · {current.comprobante_referencia}</p>
      <p className={ds.muted}>Cuenta #{current.id} · Moneda: {current.moneda || 'PEN'} · Saldo: {money(current.saldo_pendiente, current.moneda)}</p>
      <label className="block">Monto<input aria-label="Monto del abono" className={`mt-1 w-full border rounded-xl p-3 ${ds.inputCls}`} type="number" required min="0.01" max={current.saldo_pendiente} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label>
      <label className="block">Método de pago<select className={`mt-1 w-full border rounded-xl p-3 ${ds.inputCls}`} value={method} onChange={e => setMethod(e.target.value)}>{['Efectivo', 'Transferencia', 'Yape / Plin', 'Tarjeta'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="block">Referencia<input className={`mt-1 w-full border rounded-xl p-3 ${ds.inputCls}`} value={reference} onChange={e => setReference(e.target.value)} /></label>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      <div className="flex justify-end gap-2"><Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn><Btn disabled={!allowed || current.saldo_pendiente <= 0} type="submit">Confirmar abono</Btn></div>
    </form>
  </dialog>;
}
