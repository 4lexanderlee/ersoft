import React, { useMemo, useState } from 'react';
import { FaPlus, FaReceipt } from 'react-icons/fa';
import { useDS } from '../../hooks/useDS';
import { useAuth } from '../../context/AuthContext';
import { useFinanzas } from '../../context/FinanzasContext';
import { usePermission } from '../../hooks/usePermission';
import Card from '../ui/Card';
import Btn from '../ui/Btn';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import EmptyState from '../ui/EmptyState';
import GastoRendicionModal from './GastoRendicionModal';
import {
  loadSucursales, formatPEN, labelCategoria, sucursalNombre,
  ESTADO_RENDICION_COLOR,
} from './rendicionesUtils';

const ESTADOS = ['TODOS', 'PENDIENTE_APROBACION', 'APROBADO', 'RECHAZADO'];

/** Lista de rendiciones de gasto. Aprobar/Rechazar solo con permiso APROBAR_RENDICION (MASTER / ADMINISTRADOR). */
const RendicionesGastoPanel = ({ hideCreate = false, branchId = 'TODAS' }) => {
  const ds = useDS();
  const { user } = useAuth();
  const { can, effectiveSucursalId } = usePermission();
  const { rendicionesGastos, aprobarRechazarRendicion } = useFinanzas();
  const sucursales = useMemo(() => loadSucursales(), []);

  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [rechazando, setRechazando] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [motivoError, setMotivoError] = useState('');

  // Paginación a 25 registros
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  const canCrear = can('tesoreria_gastos', 'CREAR');
  const canAprobar = can('tesoreria_gastos', 'APROBAR_RENDICION');

  const filas = useMemo(() => rendicionesGastos
    .filter((r) => !effectiveSucursalId || String(r.sucursal_id) === String(effectiveSucursalId))
    .filter((r) => branchId === 'TODAS' || String(r.sucursal_id) === branchId)
    .filter((r) => estadoFiltro === 'TODOS' || r.estado === estadoFiltro)
    .sort((a, b) => String(b.fecha_solicitud).localeCompare(String(a.fecha_solicitud))),
  [rendicionesGastos, estadoFiltro, effectiveSucursalId, branchId]);


  const totalPages = Math.max(1, Math.ceil(filas.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedFilas = filas.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const aprobar = (r) => {
    if (!canAprobar) return;
    aprobarRechazarRendicion(r.id, 'APROBADO', '', user?.name || 'Administrador');
  };

  const confirmarRechazo = () => {
    if (!canAprobar) return;
    if (!motivo.trim()) { setMotivoError('Indica el motivo del rechazo.'); return; }
    aprobarRechazarRendicion(rechazando.id, 'RECHAZADO', motivo.trim(), user?.name || 'Administrador');
    setRechazando(null); setMotivo(''); setMotivoError('');
  };

  const th = `px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left ${ds.muted}`;
  const td = `px-4 py-3 text-sm ${ds.text}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {ESTADOS.map((e) => (
            <button key={e} type="button" onClick={() => { setEstadoFiltro(e); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                estadoFiltro === e ? 'bg-yellow-500 border-yellow-500 text-black' : `${ds.cardBg} ${ds.muted} hover:border-yellow-500/50`
              }`}>
              {e === 'TODOS' ? 'Todas' : e.replace('_', ' ')}
            </button>
          ))}
        </div>
        {canCrear && !hideCreate && <Btn leftIcon={<FaPlus size={11} />} onClick={() => setShowModal(true)}>Nueva rendición</Btn>}
      </div>

      {!canAprobar && (
        <p className={`text-xs ${ds.muted}`}>Tu rol puede registrar solicitudes; la aprobación la realiza un MASTER o ADMINISTRADOR.</p>
      )}

      <Card padding="none" className="overflow-x-auto">
        {filas.length === 0 ? (
          <EmptyState icon={<FaReceipt />} title="Sin rendiciones" message="No hay solicitudes con los filtros seleccionados." />
        ) : (
          <table className="w-full min-w-[900px]">
            <thead className={`border-b ${ds.divider}`}>
              <tr>
                <th className={th}>Categoría</th><th className={th}>Concepto</th><th className={th}>Responsable</th>
                <th className={th}>Sucursal</th><th className={`${th} text-right`}>Monto</th>
                <th className={`${th} text-right`}>IGV</th><th className={th}>Estado</th><th className={th} />
              </tr>
            </thead>
            <tbody>
              {pagedFilas.map((r) => (
                <tr key={r.id} className={`border-b last:border-0 ${ds.divider}`}>
                  <td className={td}>{labelCategoria(r.categoria)}</td>
                  <td className={td}>
                    <p>{r.concepto}</p>
                    <p className={`text-xs ${ds.muted}`}>{r.comprobante_referencia} · {r.fecha_solicitud}</p>
                    {r.estado === 'RECHAZADO' && r.motivo_rechazo && (
                      <p className="text-xs text-red-400">Motivo: {r.motivo_rechazo}</p>
                    )}
                  </td>
                  <td className={td}>{r.usuario_responsable}</td>
                  <td className={td}>{sucursalNombre(sucursales, r.sucursal_id)}</td>
                  <td className={`${td} text-right font-bold`}>{formatPEN(r.monto)}</td>
                  <td className={`${td} text-right`}>
                    {r.tiene_credito_fiscal_igv ? formatPEN(r.monto_igv) : <span className={ds.muted}>—</span>}
                  </td>
                  <td className={td}><Badge color={ESTADO_RENDICION_COLOR[r.estado]} dot>{r.estado.replace('_', ' ')}</Badge></td>
                  <td className={`${td} text-right`}>
                    {r.estado === 'PENDIENTE_APROBACION' && (
                      <div className="flex gap-2 justify-end">
                        <Btn size="sm" disabled={!canAprobar} onClick={() => aprobar(r)}
                          title={canAprobar ? '' : 'Requiere rol MASTER o ADMINISTRADOR'}>Aprobar</Btn>
                        <Btn size="sm" variant="danger" disabled={!canAprobar}
                          onClick={() => { setRechazando(r); setMotivo(''); setMotivoError(''); }}
                          title={canAprobar ? '' : 'Requiere rol MASTER o ADMINISTRADOR'}>Rechazar</Btn>
                      </div>
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
              Mostrando {(safePage - 1) * PAGE_SIZE + 1} - {Math.min(safePage * PAGE_SIZE, filas.length)} de {filas.length} rendiciones
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

      {showModal && <GastoRendicionModal onClose={() => setShowModal(false)} />}

      {rechazando && (
        <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
          <Card variant="raised" className="w-full max-w-sm flex flex-col gap-4">
            <div>
              <h3 className={`font-bold text-lg ${ds.text}`}>Rechazar rendición</h3>
              <p className={`text-sm ${ds.muted}`}>{rechazando.concepto} · {formatPEN(rechazando.monto)}</p>
            </div>
            <Input as="textarea" rows={3} label="Motivo del rechazo" value={motivo} autoFocus
              onChange={(e) => { setMotivo(e.target.value); setMotivoError(''); }} error={motivoError} />
            <div className="flex gap-3">
              <Btn variant="secondary" fullWidth onClick={() => setRechazando(null)}>Cancelar</Btn>
              <Btn variant="danger" fullWidth onClick={confirmarRechazo}>Rechazar</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RendicionesGastoPanel;
