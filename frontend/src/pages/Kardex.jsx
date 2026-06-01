import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventario } from '../context/InventarioContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useDS } from '../hooks/useDS';
import PageHeader from '../components/ui/PageHeader';
import { FaClipboardList, FaFileExcel, FaSave, FaEye, FaTrash, FaPencilAlt, FaTimes, FaHistory } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const Kardex = () => {
  const ds = useDS();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    productos,
    updateProducto,
    bulkUpdateStock,
    almacenes,
    lotes,
    kardexHistorial,
    addKardexReport,
    updateKardexReport,
    deleteKardexReport
  } = useInventario();

  const isMaster = user?.role === 'Master';
  const userSucursalId = user?.sucursalId || '1';

  // State
  const [activeTab, setActiveTab] = useState('generar'); // 'generar' | 'historial'
  
  // Filters
  const [filterSucursal, setFilterSucursal] = useState(isMaster ? '' : userSucursalId);
  const [filterAlmacen, setFilterAlmacen] = useState('');
  const [filterLote, setFilterLote] = useState('');

  // Historial Modals
  const [viewingReport, setViewingReport] = useState(null);
  const [editingFullReport, setEditingFullReport] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editingDiferencias, setEditingDiferencias] = useState({});
  const [savingModal, setSavingModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  
  // Stock Differences
  const [diferencias, setDiferencias] = useState({});

  // Load sucursales
  const sucursales = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('ersoft_sucursales')) || [];
    } catch {
      return [];
    }
  }, []);

  // Filter lists based on selections
  const allowedSucursales = isMaster ? sucursales : sucursales.filter(s => String(s.id) === String(userSucursalId));
  const allowedAlmacenes = almacenes.filter(a => !filterSucursal || String(a.sucursalId) === String(filterSucursal));
  const allowedLotes = lotes.filter(l => {
    if (filterAlmacen && String(l.almacenId) !== String(filterAlmacen)) return false;
    if (filterSucursal) {
      const w = almacenes.find(a => String(a.id) === String(l.almacenId));
      if (!w || String(w.sucursalId) !== String(filterSucursal)) return false;
    }
    return true;
  });

  // Generated Report Data
  const reportData = useMemo(() => {
    let result = [...productos];
    
    // Filter by Sucursal / Almacen / Lote
    result = result.filter(p => {
      // Find the lote of the product
      const lote = lotes.find(l => Number(l.id) === Number(p.loteId));
      if (!lote) return false; // if no lote, it's malformed or legacy, skip

      // 1. Lote filter
      if (filterLote && String(lote.id) !== String(filterLote)) return false;

      // 2. Almacen filter
      if (filterAlmacen && String(lote.almacenId) !== String(filterAlmacen)) return false;

      // 3. Sucursal filter
      if (filterSucursal) {
        const almacen = almacenes.find(a => Number(a.id) === Number(lote.almacenId));
        if (!almacen || String(almacen.sucursalId) !== String(filterSucursal)) return false;
      } else if (!isMaster) {
        // Enforce user branch restriction
        const almacen = almacenes.find(a => Number(a.id) === Number(lote.almacenId));
        if (!almacen || String(almacen.sucursalId) !== String(userSucursalId)) return false;
      }

      return true;
    });

    return result.map(p => {
      const val = parseFloat(p.costo || 0) * (p.stock || 0);
      return { ...p, valorizacion: val };
    });
  }, [productos, lotes, almacenes, filterSucursal, filterAlmacen, filterLote, isMaster, userSucursalId]);

  const totalValorizacion = reportData.reduce((acc, item) => acc + item.valorizacion, 0);

  // Handlers
  const handleExportExcel = (dataToExport, fileName = 'Kardex.xlsx') => {
    const wsData = dataToExport.map(p => {
      const diff = p.diferenciaAplicada ?? diferencias[p.id] ?? 0;
      const isKg = p.unidadMedida === 'Kilogramo';
      return {
        'Nombre': p.nombre,
        'Cód. Barras': p.codigoBarras || '-',
        'U.M.': isKg ? 'KG' : 'UNID',
        'Precio (S/.)': parseFloat(p.precio).toFixed(2),
        'Costo (S/.)': parseFloat(p.costo || 0).toFixed(2),
        'Stock Contado': p.stockFisico !== undefined ? (isKg ? parseFloat(p.stockFisico).toFixed(3) : p.stockFisico) : (isKg ? parseFloat(p.stock).toFixed(3) : p.stock),
        'Diferencia': diff !== 0 ? (isKg ? parseFloat(diff).toFixed(3) : diff) : 0,
        'Valorización (S/.)': p.valorizacion.toFixed(2),
      };
    });
    
    // Add Total Row
    wsData.push({
      'Nombre': 'TOTAL',
      'Cód. Barras': '',
      'U.M.': '',
      'Precio (S/.)': '',
      'Costo (S/.)': '',
      'Stock Contado': '',
      'Diferencia': '',
      'Valorización (S/.)': dataToExport.reduce((s, p) => s + p.valorizacion, 0).toFixed(2),
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kardex");
    XLSX.writeFile(wb, fileName);
  };

  const handleSaveReport = () => {
    if (!saveTitle.trim()) return;
    const filtrosDesc = [];
    if (filterSucursal) filtrosDesc.push(`Sucursal: ${sucursales.find(s => String(s.id) === filterSucursal)?.nombre}`);
    if (filterAlmacen) filtrosDesc.push(`Almacén: ${almacenes.find(a => String(a.id) === filterAlmacen)?.nombre}`);
    if (filterLote) filtrosDesc.push(`Lote: ${lotes.find(l => String(l.id) === filterLote)?.nombreLote}`);
    
    // Collect stock changes
    const stockChanges = [];

    // Apply differences and create final snapshot
    const finalSnapshot = reportData.map(p => {
      let diff = parseFloat(diferencias[p.id]) || 0;
      if (p.unidadMedida !== 'Kilogramo') diff = parseInt(diff) || 0;
      
      const currentStock = parseFloat(p.stock) || 0;
      const currentCosto = parseFloat(p.costo) || 0;
      
      const updatedStock = currentStock + diff;
      const updatedValorizacion = currentCosto * updatedStock;
      
      // Collect for bulk update if changed
      if (diff !== 0) {
        stockChanges.push({ id: p.id, delta: diff });
      }

      return {
        ...p,
        stockFisico: updatedStock,
        diferenciaAplicada: diff,
        valorizacion: updatedValorizacion
      };
    });

    if (stockChanges.length > 0 && typeof bulkUpdateStock === 'function') {
      bulkUpdateStock(stockChanges);
    }

    const newTotalValorizacion = finalSnapshot.reduce((acc, item) => acc + (parseFloat(item.valorizacion) || 0), 0);
    
    const report = {
      titulo: saveTitle,
      fecha: new Date().toLocaleString('es-PE'),
      usuarioResponsable: user?.username || 'Desconocido',
      filtros: filtrosDesc.join(' | ') || 'Todos los registros permitidos',
      productos: finalSnapshot, // Snapshot
      totalValorizacion: newTotalValorizacion
    };
    
    addKardexReport(report);
    setSavingModal(false);
    setSaveTitle('');
    setDiferencias({});
    setActiveTab('historial');
    window.alert("¡Reporte grabado exitosamente!");
  };

  const handleEditClick = (report) => {
    setEditingFullReport(report);
    setEditTitle(report.titulo);
    const difs = {};
    report.productos.forEach(p => {
      difs[p.id] = p.diferenciaAplicada ?? '';
    });
    setEditingDiferencias(difs);
  };

  const handleUpdateFullReport = () => {
    if (!editTitle.trim()) return;
    const stockChanges = [];
    
    const updatedProductos = editingFullReport.productos.map(p => {
      const oldDiff = parseFloat(p.diferenciaAplicada) || 0;
      let newDiff = parseFloat(editingDiferencias[p.id]) || 0;
      if (p.unidadMedida !== 'Kilogramo') newDiff = parseInt(newDiff) || 0;
      
      const delta = newDiff - oldDiff;
      if (delta !== 0) {
        stockChanges.push({ id: p.id, delta });
      }
      
      const originalStock = parseFloat(p.stockFisico) - oldDiff;
      const finalStockFisico = originalStock + newDiff;
      const updatedValorizacion = parseFloat(p.costo || 0) * finalStockFisico;
      
      return {
        ...p,
        stockFisico: finalStockFisico,
        diferenciaAplicada: newDiff,
        valorizacion: updatedValorizacion
      };
    });
    
    if (stockChanges.length > 0 && typeof bulkUpdateStock === 'function') {
      bulkUpdateStock(stockChanges);
    }
    
    const newTotalValorizacion = updatedProductos.reduce((acc, item) => acc + (parseFloat(item.valorizacion) || 0), 0);
    
    updateKardexReport(editingFullReport.id, {
      titulo: editTitle,
      productos: updatedProductos,
      totalValorizacion: newTotalValorizacion
    });
    
    setEditingFullReport(null);
    window.alert("¡Reporte actualizado exitosamente!");
  };

  const handleDeleteReport = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este reporte del historial?')) {
      deleteKardexReport(id);
    }
  };

  const fmt = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtKg = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  // Styles
  const btnActive = 'bg-yellow-500 text-black border-yellow-500 shadow-md';
  const btnInactive = theme === 'dark' ? 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white' : 'bg-white text-gray-500 border-gray-300 hover:text-gray-900';
  const thCls = `py-3 px-4 text-left font-semibold text-xs tracking-wider uppercase border-b ${theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`;
  const tdCls = `py-3 px-4 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-100'} ${ds.text}`;

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>
      <PageHeader
        backLabel="Volver a Inventario"
        onBack={() => navigate('/inventario')}
        right={
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('generar')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 border ${activeTab === 'generar' ? btnActive : btnInactive}`}
            >
              <FaClipboardList /> Generar Reporte
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 border ${activeTab === 'historial' ? btnActive : btnInactive}`}
            >
              <FaHistory /> Historial
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          {activeTab === 'generar' && (
            <>
              {/* Filters */}
              <div className={`p-5 rounded-2xl border ${ds.cardBg} flex gap-4 items-end flex-wrap shadow-sm`}>
                <div className="flex-1 min-w-[200px]">
                  <label className={`block text-xs font-bold uppercase mb-1.5 tracking-wider ${ds.muted}`}>Sucursal</label>
                  <select
                    value={filterSucursal}
                    onChange={e => { setFilterSucursal(e.target.value); setFilterAlmacen(''); setFilterLote(''); }}
                    disabled={!isMaster}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-yellow-500 outline-none ${ds.inputCls} ${!isMaster ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {isMaster && <option value="">Todas las Sucursales</option>}
                    {allowedSucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className={`block text-xs font-bold uppercase mb-1.5 tracking-wider ${ds.muted}`}>Almacén</label>
                  <select
                    value={filterAlmacen}
                    onChange={e => { setFilterAlmacen(e.target.value); setFilterLote(''); }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-yellow-500 outline-none ${ds.inputCls}`}
                  >
                    <option value="">Todos los Almacenes</option>
                    {allowedAlmacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className={`block text-xs font-bold uppercase mb-1.5 tracking-wider ${ds.muted}`}>Lote</label>
                  <select
                    value={filterLote}
                    onChange={e => setFilterLote(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-yellow-500 outline-none ${ds.inputCls}`}
                  >
                    <option value="">Todos los Lotes</option>
                    {allowedLotes.map(l => <option key={l.id} value={l.id}>{l.nombreLote}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportExcel(reportData)}
                    disabled={reportData.length === 0}
                    className={`px-4 py-2.5 rounded-xl border font-bold text-sm transition-all flex items-center gap-2 shadow-sm
                      ${theme === 'dark' ? 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <FaFileExcel className="text-green-600" /> Excel
                  </button>
                  <button
                    onClick={() => {
                      setSaveTitle(`Kardex - ${new Date().toLocaleDateString('es-PE')}`);
                      setSavingModal(true);
                    }}
                    disabled={reportData.length === 0}
                    className={`px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-all flex items-center gap-2 shadow-sm
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <FaSave /> Guardar Reporte
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className={`rounded-2xl border ${ds.cardBg} shadow-sm overflow-hidden flex flex-col`}>
                <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-bold ${ds.text}`}>Resultados del Kardex</h3>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20`}>
                    Total Valorizado: S/. {fmt.format(totalValorizacion)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={theme === 'dark' ? 'bg-gray-800/80' : 'bg-gray-50/80'}>
                        <th className={thCls}>Producto</th>
                        <th className={thCls}>U.M.</th>
                        <th className={`${thCls} text-right`}>Precio</th>
                        <th className={`${thCls} text-right`}>Costo</th>
                        <th className={`${thCls} text-right`}>Stock Sist.</th>
                        <th className={`${thCls} text-center`}>Diferencia</th>
                        <th className={`${thCls} text-right`}>Valorización</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((p) => {
                        const isKg = p.unidadMedida === 'Kilogramo';
                        return (
                          <tr key={p.id} className={`hover:${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'} transition-colors`}>
                            <td className={tdCls}>
                              <div className="font-semibold">{p.nombre}</div>
                              {p.codigoBarras && <div className="text-xs text-gray-500 mt-0.5">{p.codigoBarras}</div>}
                            </td>
                            <td className={tdCls}>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isKg ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                {isKg ? 'KG' : 'UNID'}
                              </span>
                            </td>
                            <td className={`${tdCls} text-right`}>S/. {fmt.format(p.precio)}</td>
                            <td className={`${tdCls} text-right text-gray-500`}>S/. {fmt.format(p.costo || 0)}</td>
                            <td className={`${tdCls} text-right font-semibold ${p.stock <= 0 ? 'text-red-500' : ''}`}>
                              {isKg ? `${fmtKg.format(p.stock)} kg` : p.stock}
                            </td>
                            <td className={`${tdCls} text-center`}>
                              <input
                                type="number"
                                step={isKg ? '0.001' : '1'}
                                placeholder="0"
                                value={diferencias[p.id] ?? ''}
                                onChange={e => setDiferencias({ ...diferencias, [p.id]: e.target.value })}
                                className={`w-20 px-2 py-1 text-center border rounded-md text-xs font-bold outline-none focus:ring-1 focus:ring-yellow-500
                                  ${theme === 'dark' ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}
                                  ${diferencias[p.id] && parseFloat(diferencias[p.id]) !== 0 ? (parseFloat(diferencias[p.id]) > 0 ? 'border-green-500 text-green-600' : 'border-red-500 text-red-500') : ''}
                                `}
                              />
                            </td>
                            <td className={`${tdCls} text-right font-bold text-indigo-500 dark:text-indigo-400`}>
                              S/. {fmt.format(p.costo * (p.stock + (parseFloat(diferencias[p.id]) || 0)))}
                            </td>
                          </tr>
                        );
                      })}
                      {reportData.length === 0 && (
                        <tr>
                          <td colSpan={6} className={`py-12 text-center text-gray-400 italic`}>
                            No se encontraron productos para los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'historial' && (
            <div className="grid gap-4">
              {kardexHistorial.length === 0 ? (
                <div className={`p-10 rounded-2xl border text-center ${ds.cardFlat}`}>
                  <FaHistory className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className={ds.muted}>No hay reportes de Kardex guardados en el historial.</p>
                </div>
              ) : (
                kardexHistorial.map(report => (
                  <div key={report.id} className={`p-5 rounded-2xl border ${ds.cardBg} shadow-sm flex items-center justify-between gap-4 transition-all hover:border-yellow-500/50`}>
                    <div className="flex flex-col gap-1">
                      <h4 className={`font-bold text-lg ${ds.text}`}>{report.titulo}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>🗓️ {report.fecha}</span>
                        <span>👤 {report.usuarioResponsable}</span>
                        <span>🔍 {report.filtros}</span>
                      </div>
                      <div className="text-indigo-500 font-bold mt-1 text-sm">
                        Total Valorizado: S/. {fmt.format(report.totalValorizacion)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(report)}
                        className={`p-2 rounded-xl border transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-600'}`}
                        title="Editar Reporte"
                      >
                        <FaPencilAlt />
                      </button>
                      <button
                        onClick={() => setViewingReport(report)}
                        className={`px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold text-sm transition-colors flex items-center gap-2`}
                      >
                        <FaEye /> Ver
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className={`p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors`}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modal Save Report */}
      {savingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 ${ds.cardBg} border`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold text-lg ${ds.text}`}>Guardar Kardex</h3>
              <button onClick={() => setSavingModal(false)} className="text-gray-400 hover:text-red-400"><FaTimes /></button>
            </div>
            <p className={`text-sm mb-4 ${ds.muted}`}>
              Se creará una foto del inventario actual con los filtros aplicados.
            </p>
            <div className="mb-5">
              <label className={`block text-xs font-bold uppercase mb-1 ${ds.muted}`}>Título o Descripción</label>
              <input
                type="text"
                autoFocus
                value={saveTitle}
                onChange={e => setSaveTitle(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-yellow-500 outline-none ${ds.inputCls}`}
                placeholder="Ej. Kardex Cierre de Mes"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSavingModal(false)} className={`flex-1 py-2 rounded-xl border font-bold ${theme === 'dark' ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Cancelar</button>
              <button onClick={handleSaveReport} className="flex-1 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Full Report */}
      {editingFullReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${ds.cardBg} border`}>
            <div className={`p-5 border-b flex flex-wrap justify-between items-center gap-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-t-2xl`}>
              <div className="flex-1 min-w-[300px]">
                <label className={`block text-xs font-bold uppercase mb-1 ${ds.muted}`}>Título del Reporte</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-yellow-500 outline-none ${ds.inputCls}`}
                />
              </div>
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <button onClick={() => setEditingFullReport(null)} className={`px-4 py-2 rounded-xl border font-bold ${theme === 'dark' ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Cancelar</button>
                <button onClick={handleUpdateFullReport} className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold">Actualizar Reporte</button>
              </div>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="mb-4 flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  Filtros Originales: {editingFullReport.filtros}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-500">
                  *Modifica las diferencias y se ajustará el stock automáticamente.
                </span>
              </div>
              
              <div className={`rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
                      <th className={thCls}>Producto</th>
                      <th className={thCls}>U.M.</th>
                      <th className={`${thCls} text-right`}>Precio</th>
                      <th className={`${thCls} text-right`}>Costo</th>
                      <th className={`${thCls} text-right`}>Stk Orig. Sist.</th>
                      <th className={`${thCls} text-center`}>Diferencia</th>
                      <th className={`${thCls} text-right`}>Valorización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingFullReport.productos.map((p, i) => {
                      const isKg = p.unidadMedida === 'Kilogramo';
                      const originalSystemStock = parseFloat(p.stockFisico) - (parseFloat(p.diferenciaAplicada) || 0);
                      return (
                        <tr key={i} className={`hover:${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'} transition-colors`}>
                          <td className={tdCls}>
                            <div className="font-semibold">{p.nombre}</div>
                            {p.codigoBarras && <div className="text-xs text-gray-500">{p.codigoBarras}</div>}
                          </td>
                          <td className={tdCls}>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isKg ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                              {isKg ? 'KG' : 'UNID'}
                            </span>
                          </td>
                          <td className={`${tdCls} text-right`}>S/. {fmt.format(p.precio)}</td>
                          <td className={`${tdCls} text-right text-gray-500`}>S/. {fmt.format(p.costo || 0)}</td>
                          <td className={`${tdCls} text-right font-semibold ${originalSystemStock <= 0 ? 'text-red-500' : ''}`}>
                            {isKg ? `${fmtKg.format(originalSystemStock)} kg` : originalSystemStock}
                          </td>
                          <td className={`${tdCls} text-center`}>
                            <input
                              type="number"
                              step={isKg ? '0.001' : '1'}
                              placeholder="0"
                              value={editingDiferencias[p.id] ?? ''}
                              onChange={e => setEditingDiferencias({ ...editingDiferencias, [p.id]: e.target.value })}
                              className={`w-20 px-2 py-1 text-center border rounded-md text-xs font-bold outline-none focus:ring-1 focus:ring-yellow-500
                                ${theme === 'dark' ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}
                                ${editingDiferencias[p.id] && parseFloat(editingDiferencias[p.id]) !== 0 ? (parseFloat(editingDiferencias[p.id]) > 0 ? 'border-green-500 text-green-600' : 'border-red-500 text-red-500') : ''}
                              `}
                            />
                          </td>
                          <td className={`${tdCls} text-right font-bold text-indigo-500 dark:text-indigo-400`}>
                            S/. {fmt.format((p.costo || 0) * (originalSystemStock + (parseFloat(editingDiferencias[p.id]) || 0)))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal View Report */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${ds.cardBg} border`}>
            <div className={`p-5 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-t-2xl`}>
              <div className="flex flex-col gap-1">
                <h3 className={`font-bold text-xl ${ds.text}`}>{viewingReport.titulo}</h3>
                <span className="text-sm text-gray-500">Generado por {viewingReport.usuarioResponsable} el {viewingReport.fecha}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleExportExcel(viewingReport.productos, `${viewingReport.titulo}.xlsx`)}
                  className={`px-4 py-2 rounded-xl border font-bold text-sm transition-all flex items-center gap-2 shadow-sm
                    ${theme === 'dark' ? 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  <FaFileExcel className="text-green-600" /> Exportar
                </button>
                <button onClick={() => setViewingReport(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="mb-4 flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  Filtros: {viewingReport.filtros}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-500">
                  Total Valorizado: S/. {fmt.format(viewingReport.totalValorizacion)}
                </span>
              </div>
              
              <div className={`rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
                      <th className={thCls}>Producto</th>
                      <th className={thCls}>U.M.</th>
                      <th className={`${thCls} text-right`}>Precio</th>
                      <th className={`${thCls} text-right`}>Costo</th>
                      <th className={`${thCls} text-right`}>Stk Contado</th>
                      <th className={`${thCls} text-right`}>Dif.</th>
                      <th className={`${thCls} text-right`}>Valorización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingReport.productos.map((p, i) => (
                      <tr key={i} className={`hover:${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'} transition-colors`}>
                        <td className={tdCls}>
                          <div className="font-semibold">{p.nombre}</div>
                          {p.codigoBarras && <div className="text-xs text-gray-500">{p.codigoBarras}</div>}
                        </td>
                        <td className={tdCls}>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.unidadMedida === 'Kilogramo' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                            {p.unidadMedida === 'Kilogramo' ? 'KG' : 'UNID'}
                          </span>
                        </td>
                        <td className={`${tdCls} text-right`}>S/. {fmt.format(p.precio)}</td>
                        <td className={`${tdCls} text-right text-gray-500`}>S/. {fmt.format(p.costo || 0)}</td>
                        <td className={`${tdCls} text-right font-semibold ${p.stockFisico <= 0 ? 'text-red-500' : ''}`}>
                          {p.unidadMedida === 'Kilogramo' ? `${fmtKg.format(p.stockFisico ?? p.stock)} kg` : (p.stockFisico ?? p.stock)}
                        </td>
                        <td className={`${tdCls} text-right font-bold ${p.diferenciaAplicada > 0 ? 'text-green-500' : p.diferenciaAplicada < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {p.diferenciaAplicada ? (p.diferenciaAplicada > 0 ? `+${p.diferenciaAplicada}` : p.diferenciaAplicada) : '-'}
                        </td>
                        <td className={`${tdCls} text-right font-bold text-indigo-500 dark:text-indigo-400`}>
                          S/. {fmt.format(p.valorizacion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Kardex;
