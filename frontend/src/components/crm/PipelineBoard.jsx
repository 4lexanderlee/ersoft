import LeadCard from './LeadCard';
import Badge from '../ui/Badge';
import { useDS } from '../../hooks/useDS';

const STAGES = ['PROSPECTO', 'CONTACTADO', 'COTIZADO', 'GANADO', 'PERDIDO'];
export default function PipelineBoard({ leads, contacts, ...actions }) {
  const ds = useDS();
  return <div className="overflow-x-auto pb-3"><div className="grid grid-cols-5 gap-4 min-w-[1300px]">
    {STAGES.map(stage => {
      const items = leads.filter(lead => lead.etapa === stage);
      return <section key={stage} aria-label={stage} className={`rounded-2xl border p-3 flex flex-col gap-3 ${ds.cardFlat}`}>
        <div className="flex justify-between items-center gap-2"><h2 className={`text-xs font-bold tracking-wider ${ds.text}`}>{stage}</h2><Badge color="gray">{items.length}</Badge></div>
        {items.map(lead => <LeadCard key={lead.id} lead={lead} nextContact={contacts.find(c => c.oportunidad.id === lead.id)?.fecha_proximo_contacto} {...actions} />)}
        {!items.length && <p className={`text-xs text-center py-8 ${ds.muted}`}>Sin oportunidades</p>}
      </section>;
    })}
  </div></div>;
}
