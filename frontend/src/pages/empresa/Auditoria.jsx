import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FaEye, FaHistory, FaLock, FaSearch, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useDS } from '../../hooks/useDS';
import { usePermission } from '../../hooks/usePermission';
import { simulatedAudit } from '../../data/simulatedAudit';
import Card from '../../components/ui/Card';
import Btn from '../../components/ui/Btn';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

const MODULES = ['VENTAS', 'CAJA', 'INVENTARIO', 'KARDEX', 'TBF', 'RENDICIONES', 'CRM', 'EMPRESA'];
const ACTION_COLORS = {
  ANULAR: 'red', ELIMINAR: 'red', EDITAR: 'amber',
  CREAR: 'green', APROBAR: 'green', TRANSPASAR: 'blue',
};
const DEFAULT_BRANCHES = [
  { id: '1', nombre: 'Sede Principal' },
  { id: '2', nombre: 'Sede Norte' },
  { id: '3', nombre: 'Sede Sur' },
];
const dateFormat = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : dateFormat.format(date);
};
const normalizeSearch = (value) => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Read-only: opening the audit view never initializes or rewrites the log.
const readArray = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === 'object') : [];
  } catch {
    return [];
  }
};

const InspectionModal = ({ record, onClose }) => {
  const ds = useDS();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="audit-detail-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className={`m-auto w-[calc(100%-2rem)] max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border p-0 shadow-2xl backdrop:bg-black/60 ${ds.cardBg} ${ds.text}`}
    >
      <div className="flex flex-col gap-5 p-6">
        <div className={`flex items-center justify-between gap-4 border-b pb-3 ${ds.divider}`}>
          <h3 id="audit-detail-title" className="text-lg font-bold">Detalle del registro #{record.id}</h3>
          <Btn variant="icon" size="sm" aria-label="Cerrar inspección" onClick={onClose}><FaTimes size={16} /></Btn>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge color={ACTION_COLORS[record.tipo_accion] || 'gray'} dot>{record.tipo_accion}</Badge>
          <span className={`text-xs font-semibold ${ds.muted}`}>{record.modulo} · {record.sucursal_nombre || 'Sin sucursal'}</span>
        </div>
        <p className="text-sm">{record.descripcion_legible}</p>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div><dt className={`text-xs font-semibold uppercase tracking-wider mb-1 ${ds.muted}`}>Usuario</dt><dd>{record.usuario}</dd></div>
          <div><dt className={`text-xs font-semibold uppercase tracking-wider mb-1 ${ds.muted}`}>Dirección IP</dt><dd className="font-mono">{record.ip || 'No registrada'}</dd></div>
          <div>
            <dt className={`text-xs font-semibold uppercase tracking-wider mb-1 ${ds.muted}`}>Fecha exacta</dt>
            <dd><time dateTime={record.fecha_hora}>{formatDate(record.fecha_hora)} (UTC−05:00)</time>
              <span className={`block text-xs font-mono mt-1 break-all ${ds.muted}`}>{record.fecha_hora}</span>
            </dd>
          </div>
        </dl>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['Datos Previos (JSON)', record.datos_previos_json],
            ['Datos Nuevos (JSON)', record.datos_nuevos_json],
          ].map(([title, data]) => (
            <Card key={title} variant="flat" className="min-w-0">
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${ds.muted}`}>{title}</h4>
              <pre tabIndex={0} aria-label={title} className="text-xs leading-relaxed font-mono overflow-auto max-h-80 whitespace-pre-wrap break-words">{JSON.stringify(data ?? null, null, 2)}</pre>
            </Card>
          ))}
        </div>
        <div className="flex justify-end"><Btn variant="secondary" onClick={onClose}>Cerrar</Btn></div>
      </div>
    </dialog>
  );
};

const AuditContent = () => {
  const ds = useDS();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can, isGlobalScope, effectiveSucursalId } = usePermission();
  const [logs, setLogs] = useState(() => readArray('ersoft_auditoria_log', simulatedAudit));
  const [branches, setBranches] = useState(() => readArray('ersoft_sucursales', DEFAULT_BRANCHES));
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('TODOS');
  const [moduleFilter, setModuleFilter] = useState('TODOS');
  const [actionFilter, setActionFilter] = useState('TODOS');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const refresh = () => {
      setLogs(readArray('ersoft_auditoria_log', simulatedAudit));
      setBranches(readArray('ersoft_sucursales', DEFAULT_BRANCHES));
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const hasBranch = effectiveSucursalId !== null && effectiveSucursalId !== undefined && effectiveSucursalId !== '';
  const allowedLogs = logs.filter(log => isGlobalScope || (
    hasBranch && String(log.sucursal_id) === String(effectiveSucursalId)
  ));
  const branchNames = new Map();
  allowedLogs.forEach(log => {
    if (log.sucursal_id != null) branchNames.set(String(log.sucursal_id), log.sucursal_nombre || `Sucursal ${log.sucursal_id}`);
  });
  branches.forEach(branch => {
    if (branch.id != null) branchNames.set(String(branch.id), branch.nombre || branch.nombreComercial || `Sucursal ${branch.id}`);
  });
  if (hasBranch && !branchNames.has(String(effectiveSucursalId))) {
    branchNames.set(String(effectiveSucursalId), user.sucursal_nombre || user.sucursalName || `Sucursal ${effectiveSucursalId}`);
  }
  const branchOptions = [...branchNames].filter(([id]) => isGlobalScope || id === String(effectiveSucursalId));
  const selectedBranch = isGlobalScope ? branchFilter : (hasBranch ? String(effectiveSucursalId) : '');
  const query = normalizeSearch(search.trim());
  const filteredLogs = allowedLogs.filter(log => (
    (selectedBranch === 'TODOS' || String(log.sucursal_id) === selectedBranch) &&
    (moduleFilter === 'TODOS' || log.modulo === moduleFilter) &&
    (actionFilter === 'TODOS' || log.tipo_accion === actionFilter) &&
    normalizeSearch(`${log.usuario} ${log.descripcion_legible}`).includes(query)
  )).sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
  // Recheck scope for inspection, independently of the visible filter controls.
  const selectedRecord = allowedLogs.find(log => log.id === selectedId);
  const labelClass = `text-xs font-semibold uppercase tracking-wider ${ds.muted}`;

  return (
    <div className={`flex flex-col h-full min-h-0 -m-6 ${ds.pageBg} ${ds.text}`}>
      <PageHeader onBack={() => navigate('/principal')} right={<Badge color="gray" dot>Solo lectura</Badge>} />
      <div className="flex-1 flex flex-col gap-6 px-6 md:px-10 py-6 max-w-7xl mx-auto w-full pb-10 overflow-y-auto">
        <div className={`flex items-center gap-2 pb-2 border-b ${ds.divider}`}>
          <FaHistory className="text-yellow-500" />
          <h2 className="font-bold text-base uppercase tracking-wider">Auditoría del Sistema</h2>
        </div>
        <Card padding="none" className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-search" className={labelClass}>Buscar</label>
            <Input id="audit-search" type="search" leftIcon={<FaSearch size={13} />} placeholder="Usuario o descripción…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-branch" className={labelClass}>Sucursal {!isGlobalScope && <FaLock className="inline" size={10} />}</label>
            <Input as="select" id="audit-branch" value={selectedBranch} disabled={!isGlobalScope} onChange={e => setBranchFilter(e.target.value)} className="disabled:opacity-70 disabled:cursor-not-allowed">
              {isGlobalScope && <option value="TODOS" className={ds.dropBg}>Todas las Sucursales (Global)</option>}
              {!isGlobalScope && !hasBranch && <option value="">Sin sucursal asignada</option>}
              {branchOptions.map(([id, name]) => <option key={id} value={id} className={ds.dropBg}>{name}</option>)}
            </Input>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-module" className={labelClass}>Módulo</label>
            <Input as="select" id="audit-module" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
              {['TODOS', ...MODULES].map(value => <option key={value} value={value} className={ds.dropBg}>{value}</option>)}
            </Input>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-action" className={labelClass}>Tipo de acción</label>
            <Input as="select" id="audit-action" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="TODOS" className={ds.dropBg}>Todas las acciones</option>
              {Object.keys(ACTION_COLORS).map(value => <option key={value} value={value} className={ds.dropBg}>{value}</option>)}
            </Input>
          </div>
        </Card>
        <p role="status" className={`text-xs ${ds.muted}`}>{filteredLogs.length} registros · Más recientes primero · Hora de Lima (UTC−05:00)</p>
        <Card padding="none" className="overflow-x-auto shrink-0">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <caption className="sr-only">Registro cronológico de auditoría</caption>
            <thead><tr className={`border-b ${ds.divider} ${ds.isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              {['Fecha y hora', 'Usuario', 'Sucursal', 'Módulo', 'Acción', 'Descripción', 'Detalle'].map(label => (
                <th key={label} scope="col" className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>{label}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredLogs.map(record => (
                <tr key={record.id} className={`border-b last:border-0 transition-colors ${ds.divider} ${ds.isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50/50'}`}>
                  <td className={`px-6 py-4 text-xs whitespace-nowrap ${ds.muted}`}><time dateTime={record.fecha_hora}>{formatDate(record.fecha_hora)}</time></td>
                  <td className="px-6 py-4 text-sm font-semibold">{record.usuario}</td>
                  <td className="px-6 py-4 text-sm">{record.sucursal_nombre || 'Sin sucursal'}</td>
                  <td className={`px-6 py-4 text-xs font-medium ${ds.muted}`}>{record.modulo}</td>
                  <td className="px-6 py-4"><Badge color={ACTION_COLORS[record.tipo_accion] || 'gray'} dot>{record.tipo_accion}</Badge></td>
                  <td className="px-6 py-4 text-sm min-w-64">{record.descripcion_legible}</td>
                  <td className="px-6 py-4 text-right">
                    {can('auditoria', 'VER') && <Btn variant="secondary" size="sm" leftIcon={<FaEye size={12} />} aria-label={`Inspeccionar registro ${record.id}`} onClick={() => setSelectedId(record.id)}>Inspeccionar</Btn>}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && <tr><td colSpan={7}><EmptyState icon={<FaHistory />} title="No se encontraron registros" message={!isGlobalScope && !hasBranch ? 'No tienes una sucursal asignada para consultar la auditoría.' : 'No hay eventos para tu alcance y los filtros seleccionados.'} /></td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
      {selectedRecord && <InspectionModal record={selectedRecord} onClose={() => setSelectedId(null)} />}
    </div>
  );
};

const Auditoria = () => {
  const { user } = useAuth();
  const { can, isGlobalScope, effectiveSucursalId } = usePermission();
  if (!can('auditoria', 'VER')) return <Navigate to="/principal" replace />;
  // Reset filters and close inspection when the simulated user or scope changes.
  return <AuditContent key={`${user.id}:${user.rol}:${isGlobalScope}:${effectiveSucursalId}`} />;
};

export default Auditoria;
