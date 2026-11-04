import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { useDS } from '../hooks/useDS';
import { getBranches, inBranch, money, pendingContacts, todayLima } from '../utils/businessData';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Btn from '../components/ui/Btn';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import PipelineBoard from '../components/crm/PipelineBoard';
import InteractionModal from '../components/crm/InteractionModal';

import { CLIENT_SEGMENTS } from '../data/simulatedClients';
import CRMTable from '../components/crm/CRMTable';

const TABS = ['Embudo de Oportunidades', 'Directorio Segmentado', 'Seguimientos del Día'];
function CRMContent() {
  const ds = useDS();
  const navigate = useNavigate();
  const { can, isGlobalScope, effectiveSucursalId } = usePermission();
  const { oportunidades, seguimientos, moverEtapaOportunidad, prepararEnvioAPOS, deleteOportunidad } = useCRM();
  const [view, setView] = useState('board');
  const [tab, setTab] = useState(0);
  const [branch, setBranch] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('TODOS');
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const branchId = isGlobalScope ? (branch === 'TODOS' ? null : branch) : effectiveSucursalId ?? undefined;
  const scoped = oportunidades.filter(o => inBranch(o, branchId));
  const leads = scoped.filter(o => (segment === 'TODOS' || (o.segmento || 'FRECUENTE') === segment)
    && `${o.cliente_nombre} ${o.documento} ${o.titulo_pedido}`.toLowerCase().includes(search.toLowerCase()));
  const contacts = pendingContacts(scoped, seguimientos);
  const active = scoped.filter(o => ['PROSPECTO', 'CONTACTADO', 'COTIZADO'].includes(o.etapa));
  const won = scoped.filter(o => o.etapa === 'GANADO').length;
  const closed = scoped.filter(o => ['GANADO', 'PERDIDO'].includes(o.etapa)).length;
  const due = contacts.filter(c => c.fecha_proximo_contacto === todayLima());
  const directory = [...new Map(leads.map(o => [`${o.tipo_documento}-${o.documento}`, o])).values()];
  const advance = (lead, stage) => {
    if (!can('crm', 'EDITAR') || !inBranch(lead, branchId)) return;
    const reason = stage === 'PERDIDO' ? window.prompt('Motivo de pérdida de la oportunidad (opcional)', lead.motivo_perdida || '') : '';
    if (reason === null) return;
    moverEtapaOportunidad(lead.id, stage, reason.trim());
  };
  const remove = lead => {
    if (!can('crm', 'ELIMINAR') || !inBranch(lead, branchId)) return;
    if (window.confirm(`¿Eliminar la oportunidad «${lead.titulo_pedido}»? Esta acción no se puede deshacer.`)) deleteOportunidad(lead.id);
  };
  const actions = { onAdvance: advance, onEdit: lead => setModal({ lead, mode: 'edit' }), onDelete: remove, onInteraction: lead => setModal({ lead }) };
  const sendPOS = lead => {
    if (!can('ventas_caja', 'CREAR') || !inBranch(lead, branchId)) return;
    if (!lead.items_cotizados?.length) return setError('Esta oportunidad no tiene ítems cotizados. Añade productos o servicios al crear el pedido para enviarlo a POS.');
    prepararEnvioAPOS(lead.id);
    navigate('/ventas');
  };
  return <div className={`flex flex-col min-h-full -m-6 ${ds.pageBg} ${ds.text}`}>
    <PageHeader onBack={() => navigate('/principal')} right={can('crm', 'CREAR') && <Btn onClick={() => setModal({ lead: null })}>Nueva oportunidad</Btn>} />
    <div className="flex flex-col gap-6 px-6 md:px-10 py-6">
      <h1 className="text-base font-bold uppercase tracking-wider">CRM Comercial</h1>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{[
        ['Prospectos Activos', active.length], ['Valor en Embudo', money(active.reduce((n, o) => n + Number(o.monto_estimado || 0), 0))],
        ['Seguimientos para Hoy', due.length], ['Tasa de Conversión', `${closed ? (won / closed * 100).toFixed(1) : '0'}%`],
      ].map(([label, value]) => <Card key={label}><p className={`text-xs uppercase font-semibold ${ds.muted}`}>{label}</p><p className="text-2xl font-bold mt-2">{value}</p>{label === 'Tasa de Conversión' && <p className={`text-xs mt-1 ${ds.muted}`}>Ganadas / cerradas</p>}</Card>)}</div>
      <Card className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input aria-label="Buscar CRM" placeholder="Cliente, documento o pedido…" value={search} onChange={e => setSearch(e.target.value)} />
        <Input as="select" aria-label="Sucursal CRM" value={isGlobalScope ? branch : String(effectiveSucursalId ?? '')} disabled={!isGlobalScope} onChange={e => setBranch(e.target.value)}>
          {isGlobalScope && <option value="TODOS">Todas las Sucursales (Global)</option>}
          {getBranches().filter(b => isGlobalScope || String(b.id) === String(effectiveSucursalId)).map(b => <option key={b.id} value={b.id}>{b.nombre || b.nombreComercial}</option>)}
        </Input>
        <Input as="select" aria-label="Filtrar segmento" value={segment} onChange={e => setSegment(e.target.value)}>{['TODOS', ...Object.keys(CLIENT_SEGMENTS)].map(s => <option key={s}>{s}</option>)}</Input>
      </Card>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <div role="tablist" className={`flex gap-2 border-b overflow-x-auto ${ds.divider}`}>{TABS.map((label, i) => <button key={label} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 ${tab === i ? 'border-yellow-500 text-yellow-600' : `border-transparent ${ds.muted}`}`}>{label}</button>)}</div>
      {tab < 2 && <div className="flex gap-2" aria-label="Vista CRM"><Btn variant={view === 'board' ? 'primary' : 'secondary'} onClick={() => setView('board')}>{tab === 0 ? 'Vista Tablero Kanban' : 'Vista Tarjetas'}</Btn><Btn variant={view === 'table' ? 'primary' : 'secondary'} onClick={() => setView('table')}>Vista Tabla Compacta</Btn></div>}
      {tab < 2 && view === 'table' && <CRMTable key={`${tab}:${search}:${segment}:${branchId}`} rows={tab === 0 ? leads : directory} directory={tab === 1} {...actions} />}
      {tab === 0 && view === 'board' && <PipelineBoard key={`${search}:${segment}:${branchId}`} leads={leads} contacts={contacts} {...actions} onPOS={sendPOS} />}
      {tab === 1 && view === 'board' && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{directory.map(lead => <Card key={`${lead.tipo_documento}-${lead.documento}`} className="space-y-3"><h2 className="font-bold">{lead.cliente_nombre}</h2><p className={`text-sm font-mono ${ds.muted}`}>{lead.tipo_documento} · {lead.documento}</p><Badge color={CLIENT_SEGMENTS[lead.segmento || 'FRECUENTE']}>{lead.segmento || 'FRECUENTE'}</Badge><p className="text-sm">{money(leads.filter(o => o.documento === lead.documento).reduce((n, o) => n + Number(o.monto_estimado || 0), 0))} en oportunidades</p>{can('crm', 'CREAR') && <Btn size="sm" variant="secondary" onClick={() => setModal({ lead })}>Registrar seguimiento</Btn>}</Card>)}{!directory.length && <EmptyState title="Sin clientes en este alcance" />}</div>}
      {tab === 2 && <div className="flex flex-col gap-3">{due.filter(c => leads.some(o => o.id === c.oportunidad.id)).map(c => <Card key={c.oportunidad.id} className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-bold">{c.oportunidad.cliente_nombre}</h2><p className={`text-sm ${ds.muted}`}>{c.oportunidad.titulo_pedido} · {c.tipo_contacto || 'Contacto inicial'} · {c.fecha_proximo_contacto}</p></div>{can('crm', 'CREAR') && <Btn variant="secondary" onClick={() => setModal({ lead: c.oportunidad })}>Registrar seguimiento</Btn>}</Card>)}{!due.length && <EmptyState title="Sin seguimientos para hoy" message="Los próximos contactos se mostrarán también en el calendario." />}</div>}
    </div>
    {modal && <InteractionModal mode={modal.mode} lead={modal.lead} branchId={branchId} onClose={() => setModal(null)} />}
  </div>;
}

export default function CRM() {
  const { user } = useAuth();
  const { can, effectiveSucursalId } = usePermission();
  if (!can('crm', 'VER')) return <Navigate to="/principal" replace />;
  return <CRMContent key={`${user.id}:${user.rol}:${effectiveSucursalId}`} />;
}
