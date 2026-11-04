import { useState } from 'react';
import { useDS } from '../../hooks/useDS';
import { usePermission } from '../../hooks/usePermission';
import { CLIENT_SEGMENTS } from '../../data/simulatedClients';
import { money } from '../../utils/businessData';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Btn from '../ui/Btn';
import Input from '../ui/Input';
import EmptyState from '../ui/EmptyState';

export default function CRMTable({ rows, directory, onAdvance, onEdit, onDelete, onInteraction }) {
  const ds = useDS();
  const { can } = usePermission();
  const [requestedPage, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / 25));
  const page = Math.min(requestedPage, pages);
  if (!rows.length) return <EmptyState title="Sin resultados" />;
  return <Card className={ds.text}>
    <div className="overflow-x-auto"><table className="w-full text-sm text-left">
      <thead className={ds.muted}><tr>{['Cliente', 'Documento', 'Segmento', ...(!directory ? ['Oportunidad', 'Monto', 'Etapa'] : []), 'Acciones'].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead>
      <tbody>{rows.slice((page - 1) * 25, page * 25).map(lead => <tr key={lead.id} className={`border-t ${ds.divider}`}>
        <td className="p-2">{lead.cliente_nombre}</td><td className="p-2">{lead.tipo_documento} · {lead.documento}</td>
        <td className="p-2"><Badge color={CLIENT_SEGMENTS[lead.segmento || 'FRECUENTE']}>{lead.segmento || 'FRECUENTE'}</Badge></td>
        {!directory && <><td className="p-2">{lead.titulo_pedido}</td><td className="p-2 whitespace-nowrap">{money(lead.monto_estimado)}</td><td className="p-2"><Input as="select" aria-label={`Etapa de ${lead.titulo_pedido}`} value={lead.etapa} disabled={!can('crm', 'EDITAR')} onChange={e => onAdvance(lead, e.target.value)}>{['PROSPECTO', 'CONTACTADO', 'COTIZADO', 'GANADO', 'PERDIDO'].map(stage => <option key={stage}>{stage}</option>)}</Input></td></>}
        <td className="p-2"><div className="flex gap-2">
          {!directory && can('crm', 'EDITAR') && <Btn size="sm" variant="secondary" onClick={() => onEdit(lead)}>Editar</Btn>}
          {!directory && can('crm', 'ELIMINAR') && <Btn size="sm" variant="ghost" onClick={() => onDelete(lead)}>Eliminar</Btn>}
          {can('crm', 'CREAR') && <Btn size="sm" variant="ghost" onClick={() => onInteraction(lead)}>Seguimiento</Btn>}
        </div></td>
      </tr>)}</tbody>
    </table></div>
    <div className="flex items-center justify-end gap-3 mt-4">
      <span className={`text-xs ${ds.muted}`}>{rows.length} registros · Página {page} de {pages} · 25 por página</span>
      <Btn size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Btn>
      <Btn size="sm" variant="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Siguiente</Btn>
    </div>
  </Card>;
}
