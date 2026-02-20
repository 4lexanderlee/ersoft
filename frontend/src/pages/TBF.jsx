import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useInventario } from '../context/InventarioContext';
import { FaArrowLeft, FaBan, FaEye, FaFilter } from 'react-icons/fa';
import { MdCalendarToday } from 'react-icons/md';

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
    <h1>${empresa?.razonSocial || 'ERSOFT'}</h1>
    <p class="center">RUC: ${empresa?.ruc || '—'}</p>
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
      <td>${r.id}</td>
      <td>${r.tipo}</td>
      <td>${r.cliente ? `${r.cliente.nombre} ${r.cliente.apellidos}` : 'Consumidor final'}</td>
      <td>${r.cliente?.documento || '—'}</td>
      <td>${fmtDate(r.fecha)}</td>
      <td style="text-align:right">S/. ${(r.total||0).toFixed(2)}</td>
      <td>${r.estado}</td>
    </tr>`).join('');
  const total = records.filter(r => r.estado === 'Activo').reduce((s, r) => s + (r.total||0), 0);
  return `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8">
    <title>Reporte TBF - ${empresa?.razonSocial || 'ERSOFT'}</title>
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

const TIPOS = ['Todos', 'Ticket', 'Boleta', 'Factura', 'Cotizar'];
const ESTADOS = ['Todos', 'Activo', 'Anulado'];

/* ─── TBF Page ─── */
const TBF = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { login, user } = useAuth();
  const { updateProducto, productos } = useInventario();

  const [comprobantes, setComprobantes] = useState([]);
  // Filters
  const [tipoFilter,   setTipoFilter]   = useState('Todos');
  const [idFilter,     setIdFilter]     = useState('');
  const [docFilter,    setDocFilter]    = useState('');
  const [fechaDesde,   setFechaDesde]   = useState('');
  const [fechaHasta,   setFechaHasta]   = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [applied,      setApplied]      = useState({});
  // Anular modal
  const [anulTarget, setAnulTarget] = useState(null); // record id to anull
  const [anulPwd,    setAnulPwd]    = useState('');
  const [anulError,  setAnulError]  = useState('');
  // Type dropdowns
  const [showTipoMenu,   setShowTipoMenu]   = useState(false);
  const [showEstadoMenu, setShowEstadoMenu] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('ersoft_comprobantes') || '[]');
    setComprobantes(saved);
  }, []);

  const persistComprobantes = (updated) => {
    localStorage.setItem('ersoft_comprobantes', JSON.stringify(updated));
    setComprobantes(updated);
  };

  // Apply filters
  const filtered = comprobantes.filter(c => {
    const f = applied;
    if (f.tipo && f.tipo !== 'Todos' && c.tipo !== f.tipo) return false;
    if (f.id   && !c.id.toLowerCase().includes(f.id.toLowerCase())) return false;
    if (f.doc  && !(c.cliente?.documento || '').includes(f.doc)) return false;
    if (f.estado && f.estado !== 'Todos' && c.estado !== f.estado) return false;
    if (f.desde && c.fecha < f.desde) return false;
    if (f.hasta && c.fecha > f.hasta + 'T23:59:59') return false;
    return true;
  });

  const totalFiltrado = filtered
    .filter(c => c.estado === 'Activo')
    .reduce((s, c) => s + (c.total || 0), 0);

  const handleApply = () => {
    setApplied({ tipo: tipoFilter, id: idFilter, doc: docFilter, estado: estadoFilter, desde: fechaDesde, hasta: fechaHasta });
  };

  const handleVer = (record) => {
    const html = buildTicketHTMLFromRecord(record);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const openAnulModal = (id) => {
    setAnulTarget(id);
    setAnulPwd('');
    setAnulError('');
  };

  const handleAnular = () => {
    const result = login(user?.username || '', anulPwd);
    if (!result?.success) { setAnulError('Contraseña incorrecta'); return; }
    const record = comprobantes.find(c => c.id === anulTarget);
    if (record && record.estado === 'Activo') {
      // Restore stock for each product item
      record.items.forEach(({ id, qty, _type }) => {
        if (_type === 'Producto') {
          const cur = productos.find(p => p.id === id);
          if (cur) updateProducto(cur.id, { ...cur, stock: (cur.stock || 0) + qty });
        }
      });
      const updated = comprobantes.map(c => c.id === anulTarget ? { ...c, estado: 'Anulado' } : c);
      persistComprobantes(updated);
    }
    setAnulTarget(null);
    setAnulPwd('');
    setAnulError('');
  };

  const handleReporte = () => {
    const empresaSnap = JSON.parse(localStorage.getItem('ersoft_empresa') || 'null');
    const html = buildReporteHTML(filtered, empresaSnap);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  // Styles
  const text    = theme === 'dark' ? 'text-white'    : 'text-gray-900';
  const subTx   = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const pageBg  = theme === 'dark' ? 'bg-[#313b48]'  : 'bg-[#d6d0d4]';
  const headerBg= theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-[#e8e3e8] border-gray-200';
  const inputCls= theme === 'dark'
    ? 'bg-transparent border-gray-600 text-white placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const dropBg  = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800';
  const cardBg  = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`flex flex-col min-h-full -m-6 ${pageBg}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-8 py-4 border-b ${headerBg}`}>
        <button onClick={() => navigate('/principal')} className={`flex items-center gap-2 font-bold text-lg hover:opacity-70 ${text}`}>
          <FaArrowLeft /> Volver al menú
        </button>
        <span className={`font-medium ${text}`}>Master</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden px-8 py-5 gap-4">

        {/* Filter Row 1 */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tipo dropdown */}
          <div className="relative">
            <button onClick={() => { setShowTipoMenu(v => !v); setShowEstadoMenu(false); }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium min-w-[100px] outline-none ${inputCls}`}>
              {tipoFilter} <span className="text-xs">▼</span>
            </button>
            {showTipoMenu && (
              <div className={`absolute top-full left-0 mt-1 w-36 rounded-2xl border shadow-xl z-30 py-1 ${dropBg}`}>
                {TIPOS.map(t => (
                  <button key={t} onClick={() => { setTipoFilter(t); setShowTipoMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-yellow-500/10 ${tipoFilter === t ? 'font-bold text-yellow-500' : ''}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ID filter */}
          <input value={idFilter} onChange={e => setIdFilter(e.target.value)}
            placeholder="ID"
            className={`px-4 py-2 border rounded-full text-sm outline-none w-32 ${inputCls}`} />

          {/* Doc filter */}
          <input value={docFilter} onChange={e => setDocFilter(e.target.value)}
            placeholder="Ingresa documento"
            className={`px-4 py-2 border rounded-full text-sm outline-none flex-1 min-w-[140px] ${inputCls}`} />

          {/* Date from */}
          <div className={`flex items-center gap-1 px-3 py-2 border rounded-full ${inputCls}`}>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="bg-transparent outline-none text-sm w-32" />
            <MdCalendarToday size={14} className="text-gray-400" />
          </div>

          {/* Date to */}
          <div className={`flex items-center gap-1 px-3 py-2 border rounded-full ${inputCls}`}>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="bg-transparent outline-none text-sm w-32" />
            <MdCalendarToday size={14} className="text-gray-400" />
          </div>
        </div>

        {/* Filter Row 2 */}
        <div className="flex items-center gap-3">
          {/* Estado dropdown */}
          <div className="relative">
            <button onClick={() => { setShowEstadoMenu(v => !v); setShowTipoMenu(false); }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium min-w-[100px] outline-none ${inputCls}`}>
              {estadoFilter} <span className="text-xs">▼</span>
            </button>
            {showEstadoMenu && (
              <div className={`absolute top-full left-0 mt-1 w-36 rounded-2xl border shadow-xl z-30 py-1 ${dropBg}`}>
                {ESTADOS.map(e => (
                  <button key={e} onClick={() => { setEstadoFilter(e); setShowEstadoMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-yellow-500/10 ${estadoFilter === e ? 'font-bold text-yellow-500' : ''}`}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2 bg-[#1a1a1a] hover:bg-gray-700 text-white text-sm font-bold rounded-full">
            <FaFilter size={11} /> APLICAR
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className={`text-sm italic ${subTx}`}>No hay comprobantes que coincidan con los filtros.</p>
            </div>
          ) : filtered.map(record => {
            const anulado = record.estado === 'Anulado';
            const clientName = record.cliente
              ? `${record.cliente.nombre || ''} ${record.cliente.apellidos || ''}`.trim()
              : 'Consumidor final';
            return (
              <div key={record.id}
                className={`flex items-center gap-4 px-5 py-3 border rounded-2xl transition-all ${cardBg} ${anulado ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${anulado ? 'line-through' : ''} ${text}`}>
                    {record.tipo} - {record.id}
                  </p>
                  <div className={`flex flex-wrap gap-4 text-xs mt-0.5 ${subTx}`}>
                    <span>{clientName}</span>
                    <span>{record.cliente?.documento || '—'}</span>
                    <span>Fecha. {fmtDate(record.fecha)}</span>
                    <span>Monto. S/. {(record.total || 0).toFixed(2)}</span>
                    {anulado && <span className="text-red-400 font-semibold">ANULADO</span>}
                  </div>
                </div>
                {/* Ver */}
                <button onClick={() => handleVer(record)}
                  className={`flex items-center gap-1 text-sm font-semibold hover:text-yellow-500 transition-colors ${text}`}>
                  <FaEye size={13} /> Ver
                </button>
                {/* Anular */}
                {!anulado && (
                  <button onClick={() => openAnulModal(record.id)}
                    title="Anular comprobante"
                    className="text-red-400 hover:text-red-500 transition-colors">
                    <FaBan size={18} />
                  </button>
                )}
                {anulado && <FaBan size={18} className="text-gray-500" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between px-8 py-4 border-t bg-black`}>
        <span className="text-white font-bold text-sm">
          MONTO: S/. {totalFiltrado.toFixed(2)}
        </span>
        <button onClick={handleReporte}
          className="px-6 py-2.5 bg-white hover:bg-gray-100 text-black font-bold rounded-full text-sm tracking-wider">
          GENERAR REPORTE
        </button>
      </div>

      {/* ── Anular Confirmation Modal ── */}
      {anulTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex items-center gap-3">
              <FaBan className="text-red-400" size={20} />
              <h3 className="font-bold text-base">Anular Comprobante</h3>
            </div>
            <p className={`text-sm ${subTx}`}>
              Esta acción anulará el comprobante <strong>{anulTarget}</strong> y restaurará el stock de los productos. Ingresa tu contraseña master para confirmar.
            </p>
            <input
              type="password"
              value={anulPwd}
              onChange={e => { setAnulPwd(e.target.value); setAnulError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAnular()}
              placeholder="Contraseña master"
              autoFocus
              className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600 placeholder-gray-500' : 'bg-gray-50 border-gray-300 placeholder-gray-400'
              }`}
            />
            {anulError && <p className="text-red-400 text-xs">{anulError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setAnulTarget(null); setAnulPwd(''); setAnulError(''); }}
                className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm ${
                  theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                }`}>
                Cancelar
              </button>
              <button onClick={handleAnular}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm">
                ANULAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TBF;
