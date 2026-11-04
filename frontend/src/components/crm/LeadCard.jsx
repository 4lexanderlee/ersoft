import { useDS } from '../../hooks/useDS';
import { usePermission } from '../../hooks/usePermission';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Btn from '../ui/Btn';
import { money } from '../../utils/businessData';

import Input from '../ui/Input';
import { CLIENT_SEGMENTS } from '../../data/simulatedClients';
const STAGES = ['PROSPECTO', 'CONTACTADO', 'COTIZADO', 'GANADO', 'PERDIDO'];
export default function LeadCard({ lead, nextContact, onAdvance, onInteraction, onPOS, onEdit, onDelete }) {
  const ds = useDS();
  const { can } = usePermission();
  return <Card padding="sm" className={`flex flex-col gap-3 ${ds.text}`}>
    <div><h3 className="text-sm font-bold">{lead.cliente_nombre}</h3><p className={`text-xs font-mono mt-1 ${ds.muted}`}>{lead.tipo_documento} · {lead.documento}</p></div>
    <div><Badge color={CLIENT_SEGMENTS[lead.segmento || 'FRECUENTE']}>{lead.segmento || 'FRECUENTE'}</Badge></div>
    <p className="text-sm font-semibold">{lead.titulo_pedido}</p>
    <p className="text-lg font-bold">{money(lead.monto_estimado)}</p>
    <p className={`text-xs ${ds.muted}`}>Próximo contacto: {nextContact || 'Sin programar'}</p>
    {can('crm', 'EDITAR') && <Input as="select" aria-label={`Etapa de ${lead.titulo_pedido}`} value={lead.etapa} onChange={e => onAdvance(lead, e.target.value)}>{STAGES.map(stage => <option key={stage}>{stage}</option>)}</Input>}
    <div className="flex flex-wrap gap-2">
      {can('crm', 'EDITAR') && <Btn size="sm" variant="secondary" onClick={() => onEdit(lead)}>Editar</Btn>}
      {can('crm', 'ELIMINAR') && <Btn size="sm" variant="ghost" onClick={() => onDelete(lead)}>Eliminar</Btn>}
      {can('crm', 'CREAR') && <Btn size="sm" variant="ghost" onClick={() => onInteraction(lead)}>Seguimiento</Btn>}
      {can('crm', 'VER') && can('ventas_caja', 'CREAR') && ['COTIZADO', 'GANADO'].includes(lead.etapa) && <Btn size="sm" onClick={() => onPOS(lead)}>Enviar a POS</Btn>}
    </div>
  </Card>;
}
