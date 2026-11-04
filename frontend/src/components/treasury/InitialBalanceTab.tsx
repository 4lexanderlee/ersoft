import { useEffect, useRef, useState } from 'react';
import { useDS } from '../../hooks/useDS';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../context/AuthContext';
import BalanceInicialCard from '../rendiciones/BalanceInicialCard';
import { Btn, useTreasury } from './legacy';
import { today } from './treasuryRules';
import type { InitialBalance } from './types';

export default function InitialBalanceTab({ branchId, creating, onClose }: { branchId: string; creating: boolean; onClose: () => void }) {
  return <><BalanceInicialCard branchId={branchId} />{creating && <InitialEntryModal branchId={branchId} onClose={onClose} />}</>;
}
function InitialEntryModal({ branchId, onClose }: { branchId: string; onClose: () => void }) {
  const ds = useDS();
  const { can, isGlobalScope, effectiveSucursalId } = usePermission();
  const { user } = useAuth();
  const { balancesIniciales, addBalanceInicial } = useTreasury();
  const [type, setType] = useState<InitialBalance['tipo']>('CAPITAL_CAJA');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="initial-title" className={`m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl p-6 border backdrop:bg-black/60 ${ds.cardBg} ${ds.text}`}>
    <form className="space-y-4" onSubmit={e => {
      e.preventDefault();
      if (!can('tesoreria_balance', 'CREAR') || (!isGlobalScope && String(effectiveSucursalId) !== branchId)) return setError('Sin permiso para esta sucursal.');
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return setError('Ingresa un monto mayor a cero.');
      if (balancesIniciales.some(b => String(b.sucursal_id) === branchId && b.tipo === type)) return setError('Ya existe este asiento inicial. Edítalo desde su tarjeta para evitar duplicarlo.');
      try { addBalanceInicial({ tipo: type, monto: Number(amount), sucursal_id: branchId, concepto: 'Asiento de apertura', fecha: today(), moneda: 'PEN', referencia: 'Registro manual de apertura', usuario_registro: user?.name || 'Usuario' }); onClose(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar.'); }
    }}>
      <h2 id="initial-title" className="font-bold text-lg">Registrar asiento inicial</h2>
      <p className={ds.muted}>Sucursal {branchId} · Patrimonio, no ingreso por venta (RN-01).</p>
      <label className="block">Tipo<select value={type} className={`block w-full rounded-xl p-3 border ${ds.inputCls}`} onChange={e => setType(e.target.value as InitialBalance['tipo'])}><option value="CAPITAL_CAJA">Capital en caja</option><option value="CAPITAL_BANCO">Capital en banco</option></select></label>
      <p className={`text-xs ${ds.muted}`}>El inventario inicial se registra desde Inventario para mantener su Kardex.</p>
      <label className="block">Monto (PEN)<input type="number" required min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={`block w-full rounded-xl border p-3 ${ds.inputCls}`} /></label>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      <div className="flex justify-end gap-2"><Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn><Btn type="submit">Guardar asiento</Btn></div>
    </form>
  </dialog>;
}
