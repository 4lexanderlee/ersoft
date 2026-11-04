import { useDS } from '../../hooks/useDS';
import { usePermission } from '../../hooks/usePermission';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Btn from '../ui/Btn';
import { money } from '../../utils/businessData';

const NEXT_STAGE = { PROSPECTO: 'CONTACTADO', CONTACTADO: 'COTIZADO', COTIZADO: 'GANADO' };
export default function LeadCard({ lead, nextContact, onAdvance, onInteraction, onPOS, onLost }) {
  const ds = useDS();
  const { can } = usePermission();
  return <Card padding="sm" className={`flex flex-col gap-3 ${ds.text}`}>
    <div><h3 className="text-sm font-bold">{lead.cliente_nombre}</h3><p className={`text-xs font-mono mt-1 ${ds.muted}`}>{lead.tipo_documento} · {lead.documento}</p></div>
    <div><Badge color={lead.segmento === 'VIP' ? 'amber' : lead.segmento === 'MAYORISTA' ? 'blue' : 'teal'}>{lead.segmento || 'FRECUENTE'}</Badge></div>
    <p className="text-sm font-semibold">{lead.titulo_pedido}</p>
    <p className="text-lg font-bold">{money(lead.monto_estimado)}</p>
    <p className={`text-xs ${ds.muted}`}>Próximo contacto: {nextContact || 'Sin programar'}</p>
    <div className="flex flex-wrap gap-2">
      {can('crm', 'EDITAR') && NEXT_STAGE[lead.etapa] && <Btn size="sm" variant="secondary" onClick={() => onAdvance(lead, NEXT_STAGE[lead.etapa])}>Avanzar a {NEXT_STAGE[lead.etapa]}</Btn>}
      {can('crm', 'CREAR') && <Btn size="sm" variant="ghost" onClick={() => onInteraction(lead)}>Seguimiento</Btn>}
      {can('crm', 'EDITAR') && NEXT_STAGE[lead.etapa] && <Btn size="sm" variant="ghost" onClick={() => onLost(lead)}>Marcar perdido</Btn>}
      {can('crm', 'VER') && can('ventas_caja', 'CREAR') && ['COTIZADO', 'GANADO'].includes(lead.etapa) && <Btn size="sm" onClick={() => onPOS(lead)}>Enviar a POS</Btn>}
    </div>
  </Card>;
}
