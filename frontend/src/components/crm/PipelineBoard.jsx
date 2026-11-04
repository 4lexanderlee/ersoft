import { useState } from 'react';
import Btn from '../ui/Btn';
import LeadCard from './LeadCard';
import Badge from '../ui/Badge';
import { useDS } from '../../hooks/useDS';

const STAGES = ['PROSPECTO', 'CONTACTADO', 'COTIZADO', 'GANADO', 'PERDIDO'];
export default function PipelineBoard({ leads, contacts, ...actions }) {
  const ds = useDS();
  const [pages, setPages] = useState({});
  return <div className="overflow-x-auto pb-3"><div className="grid grid-cols-5 gap-4 min-w-[1300px]">
    {STAGES.map(stage => {
      const items = leads.filter(lead => lead.etapa === stage);
      const page = Math.min(pages[stage] || 0, Math.max(0, Math.ceil(items.length / 10) - 1));
      return <section key={stage} aria-label={stage} className={`rounded-2xl border p-3 flex flex-col gap-3 ${ds.cardFlat}`}>
        <div className="flex justify-between items-center gap-2"><h2 className={`text-xs font-bold tracking-wider ${ds.text}`}>{stage}</h2><Badge color="gray">{items.length}</Badge></div>
        {items.slice(page * 10, (page + 1) * 10).map(lead => <LeadCard key={lead.id} lead={lead} nextContact={contacts.find(c => c.oportunidad.id === lead.id)?.fecha_proximo_contacto} {...actions} />)}
        {items.length > 10 && <div className="flex gap-2">
          <Btn size="sm" variant="ghost" disabled={!page} onClick={() => setPages(p => ({ ...p, [stage]: page - 1 }))}>Anterior</Btn>
          <Btn size="sm" variant="secondary" disabled={(page + 1) * 10 >= items.length} onClick={() => setPages(p => ({ ...p, [stage]: page + 1 }))}>Ver más</Btn>
        </div>}
        {!items.length && <p className={`text-xs text-center py-8 ${ds.muted}`}>Sin oportunidades</p>}
      </section>;
    })}
  </div></div>;
}
