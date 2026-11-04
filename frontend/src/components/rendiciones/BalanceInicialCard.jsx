import React, { useMemo, useState } from 'react';
import { FaCashRegister, FaUniversity, FaBoxes, FaEdit } from 'react-icons/fa';
import { useDS } from '../../hooks/useDS';
import { useAuth } from '../../context/AuthContext';
import { useFinanzas } from '../../context/FinanzasContext';
import { usePermission } from '../../hooks/usePermission';
import Card from '../ui/Card';
import Btn from '../ui/Btn';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import EmptyState from '../ui/EmptyState';
import { loadSucursales, formatPEN, todayISO } from './rendicionesUtils';

const TIPOS = [
  { tipo: 'CAPITAL_CAJA', titulo: 'Capital Inicial en Caja', Icon: FaCashRegister, concepto: 'Capital inicial de apertura en caja' },
  { tipo: 'CAPITAL_BANCO', titulo: 'Capital en Bancos', Icon: FaUniversity, concepto: 'Capital inicial depositado en bancos' },
  { tipo: 'INVENTARIO_APERTURA', titulo: 'Inventario Inicial Valorizado', Icon: FaBoxes, concepto: 'Inventario inicial de apertura valorizado' },
];

const BalanceTipoCard = ({ def, registros, sucursalId, puedeEditar }) => {
  const ds = useDS();
  const { user } = useAuth();
  const { addBalanceInicial, updateBalanceInicial } = useFinanzas();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const [error, setError] = useState('');

  const total = registros.reduce((s, r) => s + r.monto, 0);
  const principal = registros[0];

  const iniciarEdicion = () => { setValor(String(principal ? principal.monto : '')); setError(''); setEditando(true); };

  const guardar = () => {
    const monto = parseFloat(valor);
    if (Number.isNaN(monto) || monto < 0) { setError('Ingresa un monto válido (≥ 0).'); return; }
    if (principal) {
      updateBalanceInicial(principal.id, { monto });
    } else {
      addBalanceInicial({
        tipo: def.tipo, concepto: def.concepto, monto, sucursal_id: String(sucursalId),
        fecha: todayISO(), referencia: 'Registro manual', usuario_registro: user?.name || 'Master',
      });
    }
    setEditando(false);
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <def.Icon className="text-yellow-500" />
          <h4 className={`font-bold text-sm ${ds.text}`}>{def.titulo}</h4>
        </div>
        <Badge color="indigo">Patrimonio · No es venta</Badge>
      </div>

      {editando ? (
        <div className="flex flex-col gap-2">
          <Input type="number" min="0" step="0.01" size="sm" autoFocus value={valor}
            onChange={(e) => { setValor(e.target.value); setError(''); }} error={error} />
          <div className="flex gap-2">
            <Btn size="sm" variant="secondary" fullWidth onClick={() => setEditando(false)}>Cancelar</Btn>
            <Btn size="sm" fullWidth onClick={guardar}>Guardar</Btn>
          </div>
        </div>
      ) : (
        <>
          <p className={`text-2xl font-extrabold ${ds.text}`}>{formatPEN(total)}</p>
          <p className={`text-xs ${ds.muted}`}>
            {principal ? `${principal.referencia || principal.concepto} · ${principal.fecha}` : 'Sin registro de apertura'}
          </p>
          {puedeEditar && (
            <Btn size="sm" variant="secondary" leftIcon={<FaEdit size={11} />} onClick={iniciarEdicion}>
              {principal ? 'Editar' : 'Registrar'}
            </Btn>
          )}
        </>
      )}
    </Card>
  );
};

/** Patrimonio de Apertura por sucursal. RN-01: nunca se suma a ventas operativas. Solo MASTER edita. */
const BalanceInicialCard = ({ branchId = 'TODAS' }) => {
  const ds = useDS();
  const { balancesIniciales } = useFinanzas();
  const { can, effectiveSucursalId } = usePermission();
  const sucursales = useMemo(() => loadSucursales(), []);

  const visibles = effectiveSucursalId
    ? sucursales.filter((s) => String(s.id) === String(effectiveSucursalId))
    : sucursales.filter(s => branchId === 'TODAS' || String(s.id) === branchId);

  if (visibles.length === 0) {
    return <EmptyState title="Sin sucursales" message="Configura sucursales en el módulo Empresa." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className={`text-sm ${ds.muted}`}>
        El Balance Inicial es patrimonio de apertura (RN-01): <strong>no se contabiliza como ingreso por ventas</strong>.
      </p>
      {visibles.map((suc) => (
        <section key={suc.id} className="flex flex-col gap-3">
          <h3 className={`font-bold text-base ${ds.text}`}>{suc.nombre}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIPOS.map((def) => (
              <BalanceTipoCard
                key={def.tipo} def={def} sucursalId={suc.id} puedeEditar={can('tesoreria_balance', 'EDITAR') && def.tipo !== 'INVENTARIO_APERTURA'}
                registros={balancesIniciales.filter((b) => b.tipo === def.tipo && String(b.sucursal_id) === String(suc.id))}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default BalanceInicialCard;
