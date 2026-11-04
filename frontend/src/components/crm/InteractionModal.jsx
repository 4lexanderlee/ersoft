import { useEffect, useRef, useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useInventario } from '../../context/InventarioContext';
import { usePermission } from '../../hooks/usePermission';
import { useDS } from '../../hooks/useDS';
import { validateDocNumber, sanitizeDocNumber } from '../../utils/clientValidations';
import { todayLima, inBranch, getBranches, money } from '../../utils/businessData';
import Input from '../ui/Input';
import Btn from '../ui/Btn';
import Card from '../ui/Card';

export default function InteractionModal({ lead, branchId, onClose }) {
  const ds = useDS();
  const { user } = useAuth();
  const { can, isGlobalScope, effectiveSucursalId } = usePermission();
  const { addOportunidad, addSeguimiento, seguimientos } = useCRM();
  const { productos, servicios, lotes, almacenes } = useInventario();
  const dialogRef = useRef(null);
  const [form, setForm] = useState({ cliente_nombre: '', tipo_documento: 'DNI', documento: '', titulo_pedido: '', segmento: 'FRECUENTE', monto_estimado: '',
    sucursal_id: String(branchId || effectiveSucursalId || getBranches()[0]?.id || ''), tipo_contacto: 'WHATSAPP', detalle_conversacion: '', fecha_proximo_contacto: todayLima(), items_cotizados: [] });
  const [error, setError] = useState('');
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  useEffect(() => { const dialog = dialogRef.current; dialog.showModal(); return () => dialog.close(); }, []);
  const catalog = [...productos.map(p => ({ ...p, tipo: 'Producto' })), ...servicios.map(s => ({ ...s, tipo: 'Servicio' }))].filter(item => {
    if (item.tipo === 'Servicio') return String(item.sucursalId || '1') === form.sucursal_id;
    const lot = lotes.find(l => String(l.id) === String(item.loteId));
    const warehouse = almacenes.find(a => String(a.id) === String(lot?.almacenId));
    return String(warehouse?.sucursalId) === form.sucursal_id;
  });
  const submit = event => {
    event.preventDefault();
    if (!can('crm', 'CREAR') || (!isGlobalScope && !inBranch(lead || form, effectiveSucursalId))) return setError('No tienes permiso para esta sucursal.');
    if (!form.fecha_proximo_contacto || form.fecha_proximo_contacto < todayLima()) return setError('Selecciona un próximo contacto desde hoy.');
    if (lead) {
      if (!form.detalle_conversacion.trim()) return setError('Escribe el detalle del seguimiento.');
      addSeguimiento({ oportunidad_id: lead.oportunidad_id, cliente_id: lead.cliente_id, sucursal_id: lead.sucursal_id, tipo_contacto: form.tipo_contacto,
        detalle_conversacion: form.detalle_conversacion.trim(), fecha_contacto: todayLima(), fecha_proximo_contacto: form.fecha_proximo_contacto, usuario_registro: user.name, realizado: true });
    } else {
      const docError = validateDocNumber(form.tipo_documento, form.documento);
      if (docError) return setError(docError);
      if (!form.cliente_nombre.trim() || !form.titulo_pedido.trim() || !form.sucursal_id) return setError('Completa cliente, pedido y sucursal.');
      if (!(Number(form.monto_estimado) > 0)) return setError('El monto estimado debe ser mayor a cero.');
      addOportunidad({ ...form, vendedor_asignado: user.name, fecha_creacion: todayLima() });
    }
    onClose();
  };
  const history = lead ? seguimientos.filter(s => s.oportunidad_id === lead.oportunidad_id).sort((a, b) => Number(b.id) - Number(a.id)) : [];
  return <dialog ref={dialogRef} aria-labelledby="crm-modal-title" onCancel={e => { e.preventDefault(); onClose(); }} className={`m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] rounded-2xl border p-6 shadow-2xl backdrop:bg-black/60 overflow-y-auto ${ds.cardBg} ${ds.text}`}>
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className={`flex justify-between items-center border-b pb-3 ${ds.divider}`}><h2 id="crm-modal-title" className="text-lg font-bold">{lead ? `Seguimiento · ${lead.cliente_nombre}` : 'Nueva oportunidad comercial'}</h2><Btn type="button" variant="icon" aria-label="Cerrar" onClick={onClose}>×</Btn></div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {!lead ? <>
        <Input label="Sucursal" aria-label="Sucursal de oportunidad" as="select" value={form.sucursal_id} disabled={!isGlobalScope} onChange={e => setForm(prev => ({ ...prev, sucursal_id: e.target.value, items_cotizados: [] }))}>{getBranches().filter(b => isGlobalScope || String(b.id) === String(effectiveSucursalId)).map(b => <option key={b.id} value={b.id}>{b.nombre || b.nombreComercial}</option>)}</Input>
        <div className="grid grid-cols-2 gap-4"><Input label="Tipo de documento" aria-label="Tipo de documento" as="select" value={form.tipo_documento} onChange={e => setForm(prev => ({ ...prev, tipo_documento: e.target.value, documento: '' }))}>{['DNI', 'RUC'].map(t => <option key={t}>{t}</option>)}</Input><Input label="Documento" aria-label="Documento" value={form.documento} onChange={e => set('documento', sanitizeDocNumber(form.tipo_documento, e.target.value))} required /></div>
        <Input label="Cliente / Razón social" aria-label="Cliente" value={form.cliente_nombre} onChange={e => set('cliente_nombre', e.target.value)} required maxLength={100} />
        <Input label="Título del pedido" aria-label="Título del pedido" value={form.titulo_pedido} onChange={e => set('titulo_pedido', e.target.value)} required maxLength={160} />
        <div className="grid grid-cols-2 gap-4"><Input label="Segmento" aria-label="Segmento" as="select" value={form.segmento} onChange={e => set('segmento', e.target.value)}>{['VIP', 'MAYORISTA', 'FRECUENTE'].map(s => <option key={s}>{s}</option>)}</Input><Input label="Monto estimado S/" aria-label="Monto estimado" type="number" min="0.01" step="0.01" value={form.monto_estimado} onChange={e => set('monto_estimado', e.target.value)} required /></div>
        <Input as="select" label="Añadir producto o servicio al pedido" aria-label="Añadir ítem" value="" onChange={e => {
          const item = catalog[Number(e.target.value)]; if (!item) return;
          const items = [...form.items_cotizados, { ...item, cantidad: 1 }];
          setForm(prev => ({ ...prev, items_cotizados: items, monto_estimado: items.reduce((n, i) => n + Number(i.precio) * i.cantidad, 0).toFixed(2) }));
        }}><option value="">Seleccionar ítem…</option>{catalog.map((item, i) => <option key={`${item.tipo}-${item.id}`} value={i}>{item.nombre} · {money(item.precio)}</option>)}</Input>
        {form.items_cotizados.map((item, index) => <div key={index} className="flex items-center gap-3 text-sm"><span className="flex-1">{item.nombre}</span><Input type="number" aria-label={`Cantidad ${item.nombre}`} min="1" step="1" value={item.cantidad} onChange={e => {
          const items = form.items_cotizados.map((it, i) => i === index ? { ...it, cantidad: Math.max(1, Number(e.target.value)) } : it);
          setForm(prev => ({ ...prev, items_cotizados: items, monto_estimado: items.reduce((n, it) => n + Number(it.precio) * it.cantidad, 0).toFixed(2) }));
        }} /><Btn type="button" variant="ghost" size="sm" onClick={() => set('items_cotizados', form.items_cotizados.filter((_, i) => i !== index))}>Quitar</Btn></div>)}
      </> : <>
        <Input as="select" label="Canal de contacto" aria-label="Canal de contacto" value={form.tipo_contacto} onChange={e => set('tipo_contacto', e.target.value)}>{['WHATSAPP', 'LLAMADA', 'VISITA_LOCAL', 'CORREO'].map(c => <option key={c}>{c}</option>)}</Input>
        <Input as="textarea" label="Nota de seguimiento" aria-label="Nota de seguimiento" rows={3} required value={form.detalle_conversacion} onChange={e => set('detalle_conversacion', e.target.value)} />
      </>}
      <Input label="Fecha de próximo contacto" aria-label="Fecha de próximo contacto" type="date" required min={todayLima()} value={form.fecha_proximo_contacto} onChange={e => set('fecha_proximo_contacto', e.target.value)} />
      <div className="flex justify-end gap-3"><Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn><Btn type="submit">{lead ? 'Registrar seguimiento' : 'Crear oportunidad'}</Btn></div>
      {history.length > 0 && <Card variant="flat"><h3 className="text-xs font-bold uppercase mb-3">Bitácora de seguimiento</h3><div className="flex flex-col gap-3">{history.map(s => <div key={s.id} className="text-sm"><p className={`text-xs ${ds.muted}`}>{s.fecha_contacto} · {s.tipo_contacto} · {s.usuario_registro}</p><p>{s.detalle_conversacion}</p></div>)}</div></Card>}
    </form>
  </dialog>;
}
