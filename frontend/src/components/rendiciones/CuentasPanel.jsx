import React, { useMemo, useState, useEffect } from 'react';
import { FaMoneyBillWave, FaPlus } from 'react-icons/fa';
import { useDS } from '../../hooks/useDS';
import { useAuth } from '../../context/AuthContext';
import { useFinanzas } from '../../context/FinanzasContext';
import { usePermission } from '../../hooks/usePermission';
import Card from '../ui/Card';
import Btn from '../ui/Btn';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import EmptyState from '../ui/EmptyState';
import NuevaCxPModal from './NuevaCxPModal';
import {
  MODULO_RBAC, loadSucursales, formatPEN, estadoEfectivo, ESTADO_CUENTA_COLOR,
  sucursalNombre, selectCls,
} from './rendicionesUtils';

const ESTADOS = ['TODOS', 'PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO'];
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Yape / Plin', 'Tarjeta', 'Depósito en cuenta'];

/* ─── Modal: Registrar Abono / Pago de Cuota ─────────────────────── */
const AbonoModal = ({ cuenta, esCobro, onClose, onConfirm }) => {
  const ds = useDS();
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState(METODOS_PAGO[0]);
  const [referencia, setReferencia] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const valor = parseFloat(monto);
    if (!valor || valor <= 0) { setError('Ingresa un monto mayor a 0.'); return; }
    if (valor > cuenta.saldo_pendiente + 0.001) {
      setError(`El monto excede el saldo pendiente (${formatPEN(cuenta.saldo_pendiente)}).`);
      return;
    }
    onConfirm({ monto: valor, metodoPago: metodo, referencia: referencia.trim() });
  };

  return (
    <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
      <form onSubmit={handleSubmit} noValidate>
        <Card variant="raised" className="w-full max-w-md flex flex-col gap-4">
          <div>
            <h3 className={`font-bold text-lg ${ds.text}`}>
              {esCobro ? 'Registrar abono' : 'Registrar pago de cuota'}
            </h3>
            <p className={`text-sm ${ds.muted}`}>
              {cuenta.cliente_proveedor_nombre} · {cuenta.comprobante_referencia}
            </p>
          </div>

          <div className={`grid grid-cols-3 gap-2 text-center rounded-xl border p-3 ${ds.cardFlat}`}>
            <div><p className={`text-[11px] uppercase ${ds.muted}`}>Total</p><p className={`font-bold text-sm ${ds.text}`}>{formatPEN(cuenta.monto_total)}</p></div>
            <div><p className={`text-[11px] uppercase ${ds.muted}`}>Pagado</p><p className="font-bold text-sm text-green-500">{formatPEN(cuenta.monto_pagado)}</p></div>
            <div><p className={`text-[11px] uppercase ${ds.muted}`}>Saldo</p><p className="font-bold text-sm text-amber-500">{formatPEN(cuenta.saldo_pendiente)}</p></div>
          </div>

          <Input
            label="Monto (S/)" type="number" min="0" step="0.01" autoFocus
            value={monto} onChange={(e) => { setMonto(e.target.value); setError(''); }}
            placeholder="0.00" error={error}
          />
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-semibold uppercase tracking-wider ${ds.muted}`}>Método de pago</label>
            <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className={selectCls(ds)}>
              {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <Input
            label="Referencia (opcional)" value={referencia}
            onChange={(e) => setReferencia(e.target.value)} placeholder="N° de operación / recibo"
          />

          <div className="flex gap-3">
            <Btn type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" fullWidth>Confirmar</Btn>
          </div>
        </Card>
      </form>
    </div>
  );
};

/* ─── Panel genérico CxC / CxP ───────────────────────────────────── */
const CuentasPanel = ({ tipo }) => {
  const ds = useDS();
  const { user } = useAuth();
  const { can, effectiveSucursalId } = usePermission();
  const { cuentasCobrarPagar, registrarAbonoCuenta } = useFinanzas();

  const esCobro = tipo === 'POR_COBRAR';
  const sucursales = useMemo(() => loadSucursales(), []);
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [sucursalFiltro, setSucursalFiltro] = useState(effectiveSucursalId ? String(effectiveSucursalId) : 'TODAS');
  const [abonoCuenta, setAbonoCuenta] = useState(null);
  const [showNuevaCxP, setShowNuevaCxP] = useState(false);
  const [aviso, setAviso] = useState('');

  // Paginación a 25 registros
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  const canAbonar = can(MODULO_RBAC, 'EDITAR');
  const canCrearCxP = !esCobro && (can('cuentas_por_pagar_crear', 'CREAR') || can(MODULO_RBAC, 'CREAR'));

  const filas = useMemo(() => cuentasCobrarPagar
    .filter((c) => c.tipo === tipo)
    .map((c) => ({ ...c, estadoUI: estadoEfectivo(c) }))
    .filter((c) => estadoFiltro === 'TODOS' || c.estadoUI === estadoFiltro)
    .filter((c) => sucursalFiltro === 'TODAS' || String(c.sucursal_id) === sucursalFiltro)
    .sort((a, b) => String(a.fecha_vencimiento).localeCompare(String(b.fecha_vencimiento))),
  [cuentasCobrarPagar, tipo, estadoFiltro, sucursalFiltro]);

  useEffect(() => {
    setCurrentPage(1);
  }, [estadoFiltro, sucursalFiltro, tipo]);

  const totalPages = Math.max(1, Math.ceil(filas.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedFilas = filas.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalSaldo = filas.filter((c) => c.estadoUI !== 'PAGADO').reduce((s, c) => s + c.saldo_pendiente, 0);

  const handleConfirm = (datos) => {
    try {
      registrarAbonoCuenta(abonoCuenta.id, { ...datos, usuario: user?.name || 'Usuario' });
      setAviso(`${esCobro ? 'Abono' : 'Pago'} de ${formatPEN(datos.monto)} registrado correctamente.`);
      setAbonoCuenta(null);
    } catch (err) {
      setAviso(err.message);
    }
  };

  const th = `px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left ${ds.muted}`;
  const td = `px-4 py-3 text-sm ${ds.text}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Barra superior: Filtros y Botón Nueva CxP */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${ds.muted}`}>Estado</span>
            <div className="flex gap-1.5 flex-wrap">
              {ESTADOS.map((e) => (
                <button
                  key={e} type="button" onClick={() => setEstadoFiltro(e)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    estadoFiltro === e
                      ? 'bg-yellow-500 border-yellow-500 text-black'
                      : `${ds.cardBg} ${ds.muted} hover:border-yellow-500/50`
                  }`}
                >
                  {e === 'TODOS' ? 'Todos' : e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1 min-w-[180px]">
            <span className={`text-xs font-semibold uppercase tracking-wider ${ds.muted}`}>Sucursal</span>
            <select
              value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)}
              disabled={Boolean(effectiveSucursalId)} className={`${selectCls(ds)} !py-1.5`}
            >
              <option value="TODAS">Todas las sucursales</option>
              {sucursales.map((s) => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className={`text-sm ${ds.muted}`}>
            Saldo {esCobro ? 'por cobrar' : 'por pagar'}:{' '}
            <strong className={ds.text}>{formatPEN(totalSaldo)}</strong>
          </div>
          {canCrearCxP && (
            <Btn
              leftIcon={<FaPlus size={11} />}
              onClick={() => { setAviso(''); setShowNuevaCxP(true); }}
            >
              + Nueva Cuenta por Pagar (Proveedor)
            </Btn>
          )}
        </div>
      </div>

      {aviso && (
        <p className="text-sm text-green-500 bg-green-500/10 border border-green-500/25 rounded-xl px-4 py-2">{aviso}</p>
      )}

      <Card padding="none" className="overflow-x-auto">
        {filas.length === 0 ? (
          <EmptyState
            icon={<FaMoneyBillWave />}
            title={`Sin cuentas ${esCobro ? 'por cobrar' : 'por pagar'}`}
            message="No hay registros con los filtros seleccionados."
          />
        ) : (
          <table className="w-full min-w-[860px]">
            <thead className={`border-b ${ds.divider}`}>
              <tr>
                <th className={th}>{esCobro ? 'Cliente' : 'Proveedor'}</th>
                <th className={th}>Concepto</th>
                <th className={th}>Sucursal</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={`${th} text-right`}>Pagado</th>
                <th className={`${th} text-right`}>Saldo</th>
                <th className={th}>Vence</th>
                <th className={th}>Estado</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {pagedFilas.map((c) => (
                <tr key={c.id} className={`border-b last:border-0 ${ds.divider}`}>
                  <td className={td}>
                    <p className="font-semibold">{c.cliente_proveedor_nombre}</p>
                    <p className={`text-xs ${ds.muted}`}>{c.tipo_documento} {c.documento_identidad}</p>
                  </td>
                  <td className={td}>
                    <p>{c.concepto}</p>
                    <p className={`text-xs ${ds.muted}`}>{c.comprobante_referencia}</p>
                  </td>
                  <td className={td}>{sucursalNombre(sucursales, c.sucursal_id)}</td>
                  <td className={`${td} text-right`}>{formatPEN(c.monto_total)}</td>
                  <td className={`${td} text-right text-green-500`}>{formatPEN(c.monto_pagado)}</td>
                  <td className={`${td} text-right font-bold`}>{formatPEN(c.saldo_pendiente)}</td>
                  <td className={td}>{c.fecha_vencimiento}</td>
                  <td className={td}><Badge color={ESTADO_CUENTA_COLOR[c.estadoUI]} dot>{c.estadoUI}</Badge></td>
                  <td className={`${td} text-right`}>
                    {c.estadoUI !== 'PAGADO' && canAbonar && (
                      <Btn size="sm" onClick={() => { setAviso(''); setAbonoCuenta(c); }}>
                        {esCobro ? 'Registrar abono' : 'Pagar cuota'}
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Barra de Paginación a 25 registros */}
        {filas.length > 0 && (
          <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t ${ds.divider} ${ds.cardBg}`}>
            <span className={`text-xs font-semibold ${ds.muted}`}>
              Mostrando {(safePage - 1) * PAGE_SIZE + 1} - {Math.min(safePage * PAGE_SIZE, filas.length)} de {filas.length} registros
            </span>
            <div className="flex items-center gap-2">
              <Btn
                variant="secondary"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Anterior
              </Btn>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${ds.cardFlat} ${ds.text}`}>
                Página {safePage} de {totalPages}
              </span>
              <Btn
                variant="secondary"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {abonoCuenta && (
        <AbonoModal
          cuenta={abonoCuenta} esCobro={esCobro}
          onClose={() => setAbonoCuenta(null)} onConfirm={handleConfirm}
        />
      )}

      {showNuevaCxP && (
        <NuevaCxPModal
          isOpen={showNuevaCxP}
          onClose={() => setShowNuevaCxP(false)}
          onSuccess={(creada) => {
            setAviso(`Cuenta por pagar de ${creada?.cliente_proveedor_nombre} registrada exitosamente y programada en el calendario.`);
          }}
        />
      )}
    </div>
  );
};

export default CuentasPanel;
