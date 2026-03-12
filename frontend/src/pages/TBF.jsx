import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useInventario } from '../context/InventarioContext';
import { useDS } from '../hooks/useDS';
import { FaBan, FaEye, FaFilter, FaFileInvoiceDollar, FaTrash, FaCheckSquare } from 'react-icons/fa';
import { MdCalendarToday } from 'react-icons/md';
import PageHeader from '../components/ui/PageHeader';
import Btn from '../components/ui/Btn';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

/* ─── helpers ─── */
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
};

const buildTicketHTMLFromRecord = (record) => {
  const { empresa, items = [], cliente, tipo, fecha, total, subtotal, discount, metodoPago, id } = record;
  const date = fmtDate(fecha);
  const payLabel = { digital: 'Billetera electrónica', bank: 'Transferencia / CCI', cash: 'Efectivo' }[metodoPago] || metodoPago || '—';
  const clientName = cliente ? `${cliente.nombre || ''} ${cliente.apellidos || ''}`.trim() : 'Consumidor final';
  const rows = items.map(it => `
    <tr>
      <td>${it.nombre}</td>
      <td style="text-align:center">${it.qty}</td>
      <td style="text-align:right">S/. ${it.precio.toFixed(2)}</td>
      <td style="text-align:right">S/. ${(it.qty * it.precio).toFixed(2)}</td>
    </tr>`).join('');
  const discountRow = discount ? `<tr><td colspan="3" style="text-align:right">Descuento (${(discount*100).toFixed(0)}%)</td><td style="text-align:right;color:green">-S/. ${(subtotal*discount).toFixed(2)}</td></tr>` : '';

  const logoTag = empresa?.logoPath
    ? `<div style="text-align:center;margin-bottom:8px"><img src="${empresa.logoPath}" alt="logo" style="max-height:70px;max-width:200px;object-fit:contain" /></div>`
    : '';

  return `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8">
    <title>${empresa?.razonSocial || 'ERSOFT'} - ${tipo} ${id}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; font-size:12px; max-width:320px; margin:0 auto; padding:20px; }
      h1 { font-size:18px; text-align:center; margin-bottom:4px; }
      .center { text-align:center; }
      .divider { border-top:1px dashed #000; margin:8px 0; }
      table { width:100%; border-collapse:collapse; margin-top:6px; }
      th { border-bottom:1px solid #000; padding:4px 2px; text-align:left; font-size:11px; }
      td { padding:3px 2px; font-size:11px; }
      .total-row td { font-weight:bold; border-top:1px solid #000; }
      .footer { margin-top:16px; text-align:center; font-size:10px; }
      .anulado { color:red; font-weight:bold; text-align:center; padding:6px; border:2px solid red; }
    </style>
  </head><body>
    ${record.estado === 'Anulado' ? '<p class="anulado">⚠ COMPROBANTE ANULADO</p>' : ''}
    ${logoTag}
    <h1>${empresa?.razonSocial || 'ERSOFT'}</h1>
    <p class="center">${empresa?.tipoDocumento || 'RUC'}: ${empresa?.ruc || '—'}</p>
    <p class="center">${empresa?.direccion || ''}</p>
    <p class="center">Tel: ${empresa?.telefono || '—'}</p>
    <div class="divider"></div>
    <p class="center"><strong>N° Comprobante:</strong> ${id}</p>
    <p><strong>Comprobante:</strong> ${tipo}</p>
    <p><strong>Fecha:</strong> ${date}</p>
    <p><strong>Cliente:</strong> ${clientName}</p>
    ${cliente?.documento ? `<p><strong>Doc:</strong> ${cliente.documento}</p>` : ''}
    <p><strong>Pago:</strong> ${payLabel}</p>
    <div class="divider"></div>
    <table>
      <thead><tr><th>Descripción</th><th>Cant.</th><th>P.Unit.</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        ${discountRow}
        <tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">S/. ${(total||0).toFixed(2)}</td></tr>
      </tfoot>
    </table>
    <div class="footer">
      <div class="divider"></div>
      <p>${empresa?.pieFactura || '¡Gracias por su compra!'}</p>
      <p>®ERSOFT - Todos los derechos reservados</p>
    </div>
    <script>window.onload = () => { window.print(); }<\/script>
  </body></html>`;
};


const buildReporteHTML = (records, empresa) => {
  const rows = records.map(r => `
    <tr class="${r.estado === 'Anulado' ? 'anulado' : ''}">
      <td>${r.id}</td><td>${r.tipo}</td>
      <td>${r.cliente ? `${r.cliente.nombre} ${r.cliente.apellidos}` : 'Consumidor final'}</td>
      <td>${r.cliente?.documento || '—'}</td>
      <td>${fmtDate(r.fecha)}</td>
      <td style="text-align:right">S/. ${(r.total||0).toFixed(2)}</td>
      <td>${r.estado}</td>
    </tr>`).join('');
  const total = records.filter(r => r.estado === 'Activo').reduce((s, r) => s + (r.total||0), 0);
  return `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"><title>Reporte TBF - ${empresa?.razonSocial || 'ERSOFT'}</title>
    <style>
      body { font-family: sans-serif; font-size: 12px; padding: 20px; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      p { margin: 2px 0; color: #555; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th { background: #222; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
      td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
      tr.anulado td { color: #aaa; text-decoration: line-through; }
      .total { text-align: right; font-weight: bold; margin-top: 12px; font-size: 14px; }
      .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #aaa; }
    </style>
  </head><body>
    <h1>${empresa?.razonSocial || 'ERSOFT'} — Reporte de Comprobantes</h1>
    <p>RUC: ${empresa?.ruc || '—'} | Generado: ${new Date().toLocaleString('es-PE')}</p>
    <table>
      <thead><tr><th>ID</th><th>Tipo</th><th>Cliente</th><th>Documento</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="total">TOTAL ACTIVOS: S/. ${total.toFixed(2)}</p>
    <div class="footer">®ERSOFT - Todos los derechos reservados</div>
    <script>window.onload = () => { window.print(); }<\/script>
  </body></html>`;
};

const TIPOS   = ['Todos', 'Ticket', 'Boleta', 'Factura', 'Cotizar'];
const ESTADOS = ['Todos', 'Activo', 'Anulado'];

/* ─── TBF Page ─── */
const TBF = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { login, user } = useAuth();
  const { bulkUpdateStock } = useInventario();
  const ds = useDS();

  const [comprobantes, setComprobantes] = useState([]);
  const [tipoFilter,   setTipoFilter]   = useState('Todos');
  const [idFilter,     setIdFilter]     = useState('');
  const [docFilter,    setDocFilter]    = useState('');
  const [fechaDesde,   setFechaDesde]   = useState('');
  const [fechaHasta,   setFechaHasta]   = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [applied,      setApplied]      = useState({});
  const [anulTarget,   setAnulTarget]   = useState(null);
  const [anulPwd,      setAnulPwd]      = useState('');
  const [anulError,    setAnulError]    = useState('');
  const [showTipoMenu,   setShowTipoMenu]   = useState(false);
  const [showEstadoMenu, setShowEstadoMenu] = useState(false);

  // Bulk selection state
  const [selectMode,    setSelectMode]    = useState(false);
  const [selectedIds,   setSelectedIds]   = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPwd,       setBulkPwd]       = useState('');
  const [bulkPwdError,  setBulkPwdError]  = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('ersoft_comprobantes') || '[]');
    setComprobantes(saved);
  }, []);

  const persistComprobantes = (updated) => {
    localStorage.setItem('ersoft_comprobantes', JSON.stringify(updated));
    setComprobantes(updated);
  };

  const filtered = comprobantes.filter(c => {
    const f = applied;
    if (f.tipo   && f.tipo !== 'Todos'   && c.tipo !== f.tipo) return false;
    if (f.id     && !c.id.toLowerCase().includes(f.id.toLowerCase())) return false;
    if (f.doc    && !(c.cliente?.documento || '').includes(f.doc)) return false;
    if (f.estado && f.estado !== 'Todos' && c.estado !== f.estado) return false;
    if (f.desde  && c.fecha < f.desde) return false;
    if (f.hasta  && c.fecha > f.hasta + 'T23:59:59') return false;
    return true;
  });

  const totalFiltrado = filtered.filter(c => c.estado === 'Activo').reduce((s, c) => s + (c.total || 0), 0);

  const handleApply = () =>
    setApplied({ tipo: tipoFilter, id: idFilter, doc: docFilter, estado: estadoFilter, desde: fechaDesde, hasta: fechaHasta });

  const handleVer = (record) => {
    const html = buildTicketHTMLFromRecord(record);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const openAnulModal = (id) => { setAnulTarget(id); setAnulPwd(''); setAnulError(''); };

  // ── Bulk select helpers ──
  const enterSelectMode = () => {
    // Pre-select all currently filtered comprobantes (if no filter applied → all)
    setSelectedIds(filtered.map(c => c.id));
    setSelectMode(true);
  };
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds([]); };
  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(filtered.map(c => c.id));
  const deselectAll = () => setSelectedIds([]);

  const openBulkDeleteModal = () => { setBulkPwd(''); setBulkPwdError(''); setShowBulkModal(true); };
  const handleBulkDelete = () => {
    const result = login(user?.username || '', bulkPwd);
    if (!result?.success) { setBulkPwdError('Contraseña incorrecta'); return; }
    const updated = comprobantes.filter(c => !selectedIds.includes(c.id));
    persistComprobantes(updated);
    setShowBulkModal(false);
    exitSelectMode();
  };

  const handleAnular = () => {
    const result = login(user?.username || '', anulPwd);
    if (!result?.success) { setAnulError('Contraseña incorrecta'); return; }
    const record = comprobantes.find(c => c.id === anulTarget);
    if (record && record.estado === 'Activo') {
      // Restore stock for all products in the cancelled ticket atomically
      const changes = record.items
        .filter(it => it._type === 'Producto')
        .map(it => ({ id: it.id, delta: +it.qty }));
      if (changes.length > 0) bulkUpdateStock(changes);
      const updated = comprobantes.map(c => c.id === anulTarget ? { ...c, estado: 'Anulado' } : c);
      persistComprobantes(updated);
    }
    setAnulTarget(null); setAnulPwd(''); setAnulError('');
  };

  const handleReporte = () => {
    const empresaSnap = JSON.parse(localStorage.getItem('ersoft_empresa') || 'null');
    const html = buildReporteHTML(filtered, empresaSnap);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  // Dropdown class helpers
  const dropItemBase = 'w-full text-left px-4 py-2 text-sm transition-colors';
  const selectCls = `flex items-center gap-2 px-4 py-2.5 border rounded-full text-sm font-medium min-w-[120px] outline-none transition-colors ${ds.inputCls}`;

  return (
    <div className={`flex flex-col flex-1 -m-6 ${ds.pageBg}`}>

      {/* ── Header ── */}
      <PageHeader onBack={() => navigate('/principal')} />

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col overflow-y-auto px-6 py-5 gap-4">

        {/* Filter Row 1 */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Tipo dropdown */}
          <div className="relative">
            <button onClick={() => { setShowTipoMenu(v => !v); setShowEstadoMenu(false); }} className={selectCls}>
              {tipoFilter} <span className="text-xs ml-auto">▾</span>
            </button>
            {showTipoMenu && (
              <div className={`absolute top-full left-0 mt-1 w-36 rounded-2xl border shadow-xl z-30 py-1 ${ds.dropBg}`}>
                {TIPOS.map(t => (
                  <button key={t} onClick={() => { setTipoFilter(t); setShowTipoMenu(false); }}
                    className={`${dropItemBase} hover:bg-yellow-500/10 ${tipoFilter === t ? 'font-bold text-yellow-500' : ''}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ID filter */}
          <input value={idFilter} onChange={e => setIdFilter(e.target.value)}
            placeholder="ID comprobante"
            className={`px-4 py-2.5 border rounded-full text-sm outline-none w-36 transition-colors ${ds.inputCls}`} />

          {/* Doc filter */}
          <input value={docFilter} onChange={e => setDocFilter(e.target.value)}
            placeholder="Documento cliente"
            className={`px-4 py-2.5 border rounded-full text-sm outline-none flex-1 min-w-[160px] transition-colors ${ds.inputCls}`} />

          {/* Date from */}
          <div className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-full ${ds.inputCls}`}>
            <MdCalendarToday size={13} className={ds.iconColor} />
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="bg-transparent outline-none text-sm w-32" />
          </div>

          {/* Date to */}
          <div className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-full ${ds.inputCls}`}>
            <MdCalendarToday size={13} className={ds.iconColor} />
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="bg-transparent outline-none text-sm w-32" />
          </div>
        </div>

        {/* Filter Row 2 */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => { setShowEstadoMenu(v => !v); setShowTipoMenu(false); }} className={selectCls}>
              {estadoFilter} <span className="text-xs ml-auto">▾</span>
            </button>
            {showEstadoMenu && (
              <div className={`absolute top-full left-0 mt-1 w-36 rounded-2xl border shadow-xl z-30 py-1 ${ds.dropBg}`}>
                {ESTADOS.map(e => (
                  <button key={e} onClick={() => { setEstadoFilter(e); setShowEstadoMenu(false); }}
                    className={`${dropItemBase} hover:bg-yellow-500/10 ${estadoFilter === e ? 'font-bold text-yellow-500' : ''}`}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Btn variant="primary" size="sm" leftIcon={<FaFilter size={10} />} onClick={handleApply}>
            APLICAR
          </Btn>

          <div className="ml-auto">
            {!selectMode ? (
              <Btn variant="secondary" size="sm" leftIcon={<FaCheckSquare size={12} />} onClick={enterSelectMode}>
                Seleccionar
              </Btn>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${ds.muted}`}>{selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}</span>
                <Btn variant="secondary" size="sm" onClick={selectAll}>Todo</Btn>
                <Btn variant="secondary" size="sm" onClick={deselectAll}>Ninguno</Btn>
                <Btn
                  variant="danger" size="sm"
                  leftIcon={<FaTrash size={11} />}
                  onClick={openBulkDeleteModal}
                  disabled={selectedIds.length === 0}>
                  Eliminar
                </Btn>
                <Btn variant="secondary" size="sm" onClick={exitSelectMode}>Cancelar</Btn>
              </div>
            )}
          </div>
        </div>

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FaFileInvoiceDollar />}
              title="Sin comprobantes"
              message="No hay comprobantes que coincidan con los filtros seleccionados."
            />
          ) : filtered.map(record => {
            const anulado = record.estado === 'Anulado';
            const isSelected = selectedIds.includes(record.id);
            const clientName = record.cliente
              ? `${record.cliente.nombre || ''} ${record.cliente.apellidos || ''}`.trim()
              : 'Consumidor final';

            return (
              <Card key={record.id} padding="none"
                onClick={selectMode ? () => toggleSelect(record.id) : undefined}
                className={`flex items-center gap-4 px-5 py-3.5 transition-all cursor-${selectMode ? 'pointer' : 'default'} ${
                  anulado ? 'opacity-50' : ''
                } ${
                  selectMode && isSelected ? 'ring-2 ring-yellow-500/70' : ''
                }`}>

                {/* Checkbox in selection mode */}
                {selectMode && (
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-yellow-500 border-yellow-500'
                      : ds.isDark ? 'border-gray-500' : 'border-gray-400'
                  }`}>
                    {isSelected && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-bold text-sm ${anulado ? 'line-through' : ''} ${ds.text}`}>
                      {record.tipo} · {record.id}
                    </p>
                    <Badge color={anulado ? 'red' : 'green'} dot>
                      {record.estado}
                    </Badge>
                  </div>
                  <div className={`flex flex-wrap gap-4 text-xs mt-1 ${ds.muted}`}>
                    <span>{clientName}</span>
                    <span>{record.cliente?.documento || '—'}</span>
                    <span>{fmtDate(record.fecha)}</span>
                    <span className="font-semibold">S/. {(record.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions — hidden in select mode */}
                {!selectMode && (
                  <>
                    <Btn variant="ghost" size="sm" leftIcon={<FaEye size={12} />} onClick={() => handleVer(record)}>
                      Ver
                    </Btn>
                    {!anulado
                      ? <Btn variant="icon" size="sm" onClick={() => openAnulModal(record.id)} title="Anular"><FaBan size={16} className="text-red-400" /></Btn>
                      : <FaBan size={16} className={ds.subtle} />
                    }
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-8 py-4 border-t bg-black">
        <span className="text-white font-bold text-sm">
          MONTO FILTRADO: S/. {totalFiltrado.toFixed(2)}
        </span>
        <Btn variant="secondary" onClick={handleReporte}
          className="!border-white !text-white hover:!bg-white/10">
          GENERAR REPORTE
        </Btn>
      </div>

      {/* ── Anular Modal ── */}
      {anulTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <Card variant="raised" className="w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <FaBan className="text-red-400 shrink-0" size={18} />
              <h3 className={`font-bold text-base ${ds.text}`}>Anular Comprobante</h3>
            </div>
            <p className={`text-sm ${ds.muted}`}>
              Anulará el comprobante <strong className={ds.text}>{anulTarget}</strong> y restaurará el stock. Confirma con tu contraseña master.
            </p>
            <input
              type="password" value={anulPwd} autoFocus
              onChange={e => { setAnulPwd(e.target.value); setAnulError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAnular()}
              placeholder="Contraseña master"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400/50 ${ds.inputDarkFilled}`}
            />
            {anulError && <p className="text-red-400 text-xs">{anulError}</p>}
            <div className="flex gap-3">
              <Btn variant="secondary" fullWidth onClick={() => { setAnulTarget(null); setAnulPwd(''); setAnulError(''); }}>
                Cancelar
              </Btn>
              <Btn variant="danger" fullWidth onClick={handleAnular}>ANULAR</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* ── Bulk Delete Modal ── */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <Card variant="raised" className="w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <FaTrash className="text-red-400 shrink-0" size={16} />
              <h3 className={`font-bold text-base ${ds.text}`}>Eliminar Comprobantes</h3>
            </div>
            <p className={`text-sm ${ds.muted}`}>
              Se eliminarán permanentemente <strong className={ds.text}>{selectedIds.length} comprobante{selectedIds.length !== 1 ? 's' : ''}</strong>. Esta acción no se puede deshacer. Confirma con tu contraseña master.
            </p>
            <input
              type="password" value={bulkPwd} autoFocus
              onChange={e => { setBulkPwd(e.target.value); setBulkPwdError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleBulkDelete()}
              placeholder="Contraseña master"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400/50 ${ds.inputDarkFilled}`}
            />
            {bulkPwdError && <p className="text-red-400 text-xs">{bulkPwdError}</p>}
            <div className="flex gap-3">
              <Btn variant="secondary" fullWidth onClick={() => setShowBulkModal(false)}>
                Cancelar
              </Btn>
              <Btn variant="danger" fullWidth onClick={handleBulkDelete}>ELIMINAR</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TBF;
