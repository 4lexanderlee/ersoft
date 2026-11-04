import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventario } from '../context/InventarioContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useDS } from '../hooks/useDS';
import { usePermission } from '../hooks/usePermission';
import PageHeader from '../components/ui/PageHeader';
import Btn from '../components/ui/Btn';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import {
  FaClipboardList,
  FaFileExcel,
  FaSave,
  FaEye,
  FaTrash,
  FaPencilAlt,
  FaTimes,
  FaHistory,
  FaBook,
  FaPlusCircle,
  FaExchangeAlt,
  FaSearch,
  FaCheckCircle,
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 25;

const MOVEMENT_TYPE_BADGES = {
  INVENTARIO_INICIAL: { color: 'teal', label: 'INVENTARIO INICIAL' },
  COMPRA: { color: 'green', label: 'COMPRA' },
  VENTA: { color: 'blue', label: 'VENTA' },
  TRASPASO_ENTRADA: { color: 'indigo', label: 'TRASPASO ENTRADA' },
  TRASPASO_SALIDA: { color: 'amber', label: 'TRASPASO SALIDA' },
  AJUSTE_POSITIVO: { color: 'green', label: 'AJUSTE (+)' },
  AJUSTE_NEGATIVO: { color: 'red', label: 'AJUSTE (-)' },
  ANULACION_VENTA: { color: 'amber', label: 'ANULACIÓN VENTA' },
};

const Kardex = () => {
  const ds = useDS();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user, verifyPassword } = useAuth();
  const { can } = usePermission();

  const {
    productos,
    updateProducto,
    bulkUpdateStock,
    almacenes,
    lotes,
    kardexHistorial,
    addKardexReport,
    updateKardexReport,
    deleteKardexReport,
    kardexMovimientos = [],
    registrarAjusteManualKardex,
  } = useInventario();

  const isMaster = user?.role === 'Master' || user?.rol === 'MASTER';
  const userRoleStr = String(user?.role || user?.rol || '').toUpperCase();
  const userSucursalId = user?.sucursalId || user?.sucursal_id || '1';

  // Role permission to create manual kardex adjustments (Master, Admin, Almacenero)
  const canMakeAdjustment = isMaster || can('inventario', 'EDITAR') || ['ADMINISTRADOR', 'ALMACENERO'].includes(userRoleStr);

  // Active Tab: 'ledger' (Libro Diario Valorizado) | 'snapshot' (Balance por Producto) | 'historial' (Reportes Guardados)
  const [activeTab, setActiveTab] = useState('ledger');

  // Ledger Filters
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTipoMov, setLedgerTipoMov] = useState('');
  const [ledgerFilterAlmacen, setLedgerFilterAlmacen] = useState('');
  const [ledgerFilterLote, setLedgerFilterLote] = useState('');
  const [ledgerPage, setLedgerPage] = useState(1);

  // Snapshot Filters
  const [filterSucursal, setFilterSucursal] = useState(isMaster ? '' : userSucursalId);
  const [filterAlmacen, setFilterAlmacen] = useState('');
  const [filterLote, setFilterLote] = useState('');
  const [snapshotPage, setSnapshotPage] = useState(1);

  // Manual Adjustment Modal State
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({
    productoId: '',
    varianteId: '',
    almacenId: '',
    loteId: '',
    tipoAjuste: 'AJUSTE_POSITIVO',
    cantidad: '1',
    costoUnitario: '0',
    motivo: 'Conteo físico de inventario',
    password: '',
  });
  const [ajusteError, setAjusteError] = useState('');
  const [ajusteSuccess, setAjusteSuccess] = useState('');

  // Snapshot Historial Modals
  const [viewingReport, setViewingReport] = useState(null);
  const [editingFullReport, setEditingFullReport] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editingDiferencias, setEditingDiferencias] = useState({});
  const [savingModal, setSavingModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [diferencias, setDiferencias] = useState({});

  // Reset pagination on filter change
  useEffect(() => { setLedgerPage(1); }, [ledgerSearch, ledgerTipoMov, ledgerFilterAlmacen, ledgerFilterLote]);
  useEffect(() => { setSnapshotPage(1); }, [filterSucursal, filterAlmacen, filterLote]);

  // Load sucursales
  const sucursales = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ersoft_sucursales')) || []; }
    catch { return []; }
  }, []);

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

  // ── Filtered Valorized Ledger Movements ────────────────────────
  const filteredLedgerMovimientos = useMemo(() => {
    let list = [...kardexMovimientos];

    if (ledgerSearch.trim()) {
      const q = ledgerSearch.trim().toLowerCase();
      list = list.filter(m =>
        (m.productoNombre && m.productoNombre.toLowerCase().includes(q)) ||
        (m.sku && m.sku.toLowerCase().includes(q)) ||
        (m.variante && m.variante.toLowerCase().includes(q)) ||
        (m.motivo && m.motivo.toLowerCase().includes(q))
      );
    }

    if (ledgerTipoMov) {
      list = list.filter(m => m.tipoMovimiento === ledgerTipoMov);
    }

    if (ledgerFilterAlmacen) {
      list = list.filter(m => String(m.almacenId) === String(ledgerFilterAlmacen));
    }

    if (ledgerFilterLote) {
      list = list.filter(m => String(m.loteId) === String(ledgerFilterLote));
    }

    return list;
  }, [kardexMovimientos, ledgerSearch, ledgerTipoMov, ledgerFilterAlmacen, ledgerFilterLote]);

  // Paginated Ledger Movements (25 per page)
  const paginatedLedger = useMemo(() => {
    const start = (ledgerPage - 1) * PAGE_SIZE;
    return filteredLedgerMovimientos.slice(start, start + PAGE_SIZE);
  }, [filteredLedgerMovimientos, ledgerPage]);

  // Snapshot Report Data
  const reportData = useMemo(() => {
    let result = [...productos];
    result = result.filter(p => {
      const lote = lotes.find(l => Number(l.id) === Number(p.loteId));
      if (!lote) return false;
      if (filterLote && String(lote.id) !== String(filterLote)) return false;
      if (filterAlmacen && String(lote.almacenId) !== String(filterAlmacen)) return false;
      if (filterSucursal) {
        const almacen = almacenes.find(a => Number(a.id) === Number(lote.almacenId));
        if (!almacen || String(almacen.sucursalId) !== String(filterSucursal)) return false;
      } else if (!isMaster) {
        const almacen = almacenes.find(a => Number(a.id) === Number(lote.almacenId));
        if (!almacen || String(almacen.sucursalId) !== String(userSucursalId)) return false;
      }
      return true;
    });

    return result.map(p => {
      const val = parseFloat(p.costo || 0) * (parseFloat(p.stock) || 0);
      return { ...p, valorizacion: val };
    });
  }, [productos, lotes, almacenes, filterSucursal, filterAlmacen, filterLote, isMaster, userSucursalId]);

  const totalValorizacionSnapshot = reportData.reduce((acc, item) => acc + item.valorizacion, 0);

  // Paginated Snapshot Products (25 per page)
  const paginatedSnapshot = useMemo(() => {
    const start = (snapshotPage - 1) * PAGE_SIZE;
    return reportData.slice(start, start + PAGE_SIZE);
  }, [reportData, snapshotPage]);

  // ── Excel Export Handlers ──────────────────────────────────────
  const handleExportLedgerExcel = () => {
    const wsData = filteredLedgerMovimientos.map(m => ({
      'Fecha / Hora': m.fecha,
      'Producto': m.productoNombre,
      'SKU': m.sku || '-',
      'Variante': m.variante || '-',
      'U.M.': m.unidadMedida || 'NIU',
      'Almacén': m.almacenNombre,
      'Lote': m.loteNombre,
      'Tipo Movimiento': m.tipoMovimiento,
      'Cantidad': m.cantidad,
      'Costo Unitario (S/.)': parseFloat(m.costoUnitario || 0).toFixed(2),
      'Costo Total (S/.)': parseFloat(m.costoTotal || 0).toFixed(2),
      'Saldo Físico': m.saldoFisico,
      'Costo Promedio Ponderado (S/.)': parseFloat(m.costoPromedioPonderado || 0).toFixed(2),
      'Saldo Valorizado Total (S/.)': parseFloat(m.saldoValorizado || 0).toFixed(2),
      'Motivo': m.motivo || '-',
      'Responsable': m.usuario || 'Sistema',
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kardex Valorizado');
    XLSX.writeFile(wb, `Kardex_Valorizado_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportSnapshotExcel = (dataToExport, fileName = 'Kardex_Snapshot.xlsx') => {
    const wsData = dataToExport.map(p => {
      const diff = p.diferenciaAplicada ?? diferencias[p.id] ?? 0;
      const isKg = p.unidadMedida === 'KGM' || p.unidadMedida === 'Kilogramo';
      return {
        'Nombre': p.nombre,
        'Cód. Barras': p.codigoBarras || '-',
        'U.M.': p.unidadMedida || (isKg ? 'KG' : 'NIU'),
        'Precio (S/.)': parseFloat(p.precio).toFixed(2),
        'Costo (S/.)': parseFloat(p.costo || 0).toFixed(2),
        'Stock Contado': p.stockFisico !== undefined ? (isKg ? parseFloat(p.stockFisico).toFixed(3) : p.stockFisico) : (isKg ? parseFloat(p.stock).toFixed(3) : p.stock),
        'Diferencia': diff !== 0 ? (isKg ? parseFloat(diff).toFixed(3) : diff) : 0,
        'Valorización (S/.)': p.valorizacion.toFixed(2),
      };
    });

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
    XLSX.utils.book_append_sheet(wb, ws, 'Balance Kardex');
    XLSX.writeFile(wb, fileName);
  };

  // ── Manual Adjustment Modal Operations ────────────────────────
  const openAjusteModal = () => {
    const firstProd = productos[0];
    setAjusteForm({
      productoId: firstProd ? firstProd.id : '',
      varianteId: firstProd?.variantes?.[0]?.id || '',
      almacenId: almacenes[0]?.id || 101,
      loteId: lotes[0]?.id || 101,
      tipoAjuste: 'AJUSTE_POSITIVO',
      cantidad: '1',
      costoUnitario: String(firstProd?.costo || '0'),
      motivo: 'Ajuste por conteo físico de inventario',
      password: '',
    });
    setAjusteError('');
    setAjusteSuccess('');
    setShowAjusteModal(true);
  };

  const handleAjusteProductoChange = (id) => {
    const prod = productos.find(p => p.id === Number(id));
    setAjusteForm(prev => ({
      ...prev,
      productoId: Number(id),
      varianteId: prod?.variantes?.[0]?.id || '',
      costoUnitario: String(prod?.costo || '0'),
    }));
  };

  const handleConfirmAjuste = (e) => {
    e.preventDefault();
    setAjusteError('');
    setAjusteSuccess('');

    if (!verifyPassword(ajusteForm.password)) {
      setAjusteError('Contraseña incorrecta. Se requiere confirmación de seguridad.');
      return;
    }

    const cant = parseFloat(ajusteForm.cantidad);
    if (isNaN(cant) || cant <= 0) {
      setAjusteError('La cantidad debe ser un número positivo.');
      return;
    }

    const res = registrarAjusteManualKardex({
      productoId: Number(ajusteForm.productoId),
      varianteId: ajusteForm.varianteId || null,
      almacenId: Number(ajusteForm.almacenId),
      loteId: Number(ajusteForm.loteId),
      tipoAjuste: ajusteForm.tipoAjuste,
      cantidad: cant,
      costoUnitario: parseFloat(ajusteForm.costoUnitario) || 0,
      motivo: ajusteForm.motivo.trim() || 'Ajuste manual de inventario',
      usuario: user?.username || userRoleStr,
    });

    if (!res.success) {
      setAjusteError(res.error || 'Error al procesar el ajuste');
      return;
    }

    setAjusteSuccess('¡Ajuste de Kardex registrado exitosamente en el libro mayor!');
    setTimeout(() => {
      setShowAjusteModal(false);
      setAjusteSuccess('');
    }, 1200);
  };

  // ── Snapshot Save & Edit Handlers ─────────────────────────────
  const handleSaveReport = () => {
    if (!saveTitle.trim()) return;
    const filtrosDesc = [];
    if (filterSucursal) filtrosDesc.push(`Sucursal: ${sucursales.find(s => String(s.id) === filterSucursal)?.nombre}`);
    if (filterAlmacen) filtrosDesc.push(`Almacén: ${almacenes.find(a => String(a.id) === filterAlmacen)?.nombre}`);
    if (filterLote) filtrosDesc.push(`Lote: ${lotes.find(l => String(l.id) === filterLote)?.nombre}`);

    const stockChanges = [];
    const finalSnapshot = reportData.map(p => {
      let diff = parseFloat(diferencias[p.id]) || 0;
      if (!p.permite_decimales) diff = parseInt(diff, 10) || 0;
      const currentStock = parseFloat(p.stock) || 0;
      const currentCosto = parseFloat(p.costo) || 0;
      const updatedStock = currentStock + diff;
      const updatedValorizacion = currentCosto * updatedStock;

      if (diff !== 0) {
        stockChanges.push({ id: p.id, delta: diff });
      }

      return {
        ...p,
        stockFisico: updatedStock,
        diferenciaAplicada: diff,
        valorizacion: updatedValorizacion,
      };
    });

    if (stockChanges.length > 0 && typeof bulkUpdateStock === 'function') {
      bulkUpdateStock(stockChanges);
    }

    const newTotalValorizacion = finalSnapshot.reduce((acc, item) => acc + (parseFloat(item.valorizacion) || 0), 0);

    const report = {
      titulo: saveTitle,
      fecha: new Date().toLocaleString('es-PE'),
      usuarioResponsable: user?.username || userRoleStr || 'Administrador',
      filtros: filtrosDesc.join(' | ') || 'Todos los registros permitidos',
      productos: finalSnapshot,
      totalValorizacion: newTotalValorizacion,
    };

    addKardexReport(report);
    setSavingModal(false);
    setSaveTitle('');
    setDiferencias({});
    setActiveTab('historial');
    window.alert('¡Reporte grabado exitosamente!');
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
      if (!p.permite_decimales) newDiff = parseInt(newDiff, 10) || 0;

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
        valorizacion: updatedValorizacion,
      };
    });

    if (stockChanges.length > 0 && typeof bulkUpdateStock === 'function') {
      bulkUpdateStock(stockChanges);
    }

    const newTotalValorizacion = updatedProductos.reduce((acc, item) => acc + (parseFloat(item.valorizacion) || 0), 0);

    updateKardexReport(editingFullReport.id, {
      titulo: editTitle,
      productos: updatedProductos,
      totalValorizacion: newTotalValorizacion,
    });

    setEditingFullReport(null);
    window.alert('¡Reporte actualizado exitosamente!');
  };

  const handleDeleteReport = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este reporte del historial?')) {
      deleteKardexReport(id);
    }
  };

  const fmt = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtKg = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  const btnActive = 'bg-yellow-500 text-black border-yellow-500 shadow-sm';
  const btnInactive = theme === 'dark' ? 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white' : 'bg-white text-gray-500 border-gray-300 hover:text-gray-900';
  const thCls = `py-3 px-3 text-left font-semibold text-[11px] tracking-wider uppercase border-b ${theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`;
  const tdCls = `py-2.5 px-3 border-b text-xs ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-100'} ${ds.text}`;

  const selectedProdForAjuste = productos.find(p => p.id === Number(ajusteForm.productoId));

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>
      {/* Header with Tab Navigation */}
      <PageHeader
        backLabel="Volver a Inventario"
        onBack={() => navigate('/inventario')}
        right={
          <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border ${
                activeTab === 'ledger' ? btnActive : btnInactive
              }`}
            >
              <FaBook /> Libro Diario Valorizado
            </button>
            <button
              onClick={() => setActiveTab('snapshot')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border ${
                activeTab === 'snapshot' ? btnActive : btnInactive
              }`}
            >
              <FaClipboardList /> Balance por Producto
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border ${
                activeTab === 'historial' ? btnActive : btnInactive
              }`}
            >
              <FaHistory /> Historial Guardado
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-5 pb-20">
        <div className="max-w-7xl mx-auto flex flex-col gap-5">

          {/* ══════════ TAB 1: LIBRO DIARIO VALORIZADO (OFFICIAL LEDGER) ══════════ */}
          {activeTab === 'ledger' && (
            <>
              {/* Filter & Action Toolbar */}
              <div className={`p-4 rounded-2xl border ${ds.cardBg} flex flex-wrap gap-3 items-end justify-between shadow-sm`}>
                <div className="flex flex-wrap gap-3 items-end flex-1 min-w-[280px]">
                  {/* Search */}
                  <div className="flex-1 min-w-[180px]">
                    <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Buscar Producto o SKU</label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={11} />
                      <input
                        value={ledgerSearch}
                        onChange={e => setLedgerSearch(e.target.value)}
                        placeholder="Nombre, SKU, motivo..."
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
                      />
                    </div>
                  </div>

                  {/* Movement Type Filter */}
                  <div className="w-44">
                    <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Tipo de Movimiento</label>
                    <select
                      value={ledgerTipoMov}
                      onChange={e => setLedgerTipoMov(e.target.value)}
                      className={`w-full px-2.5 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
                    >
                      <option value="">Todos los Tipos</option>
                      {Object.keys(MOVEMENT_TYPE_BADGES).map(key => (
                        <option key={key} value={key}>{MOVEMENT_TYPE_BADGES[key].label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Almacén Filter */}
                  <div className="w-44">
                    <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Almacén</label>
                    <select
                      value={ledgerFilterAlmacen}
                      onChange={e => setLedgerFilterAlmacen(e.target.value)}
                      className={`w-full px-2.5 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
                    >
                      <option value="">Todos los Almacenes</option>
                      {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleExportLedgerExcel}
                    className={`px-3.5 py-2 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                      theme === 'dark' ? 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FaFileExcel className="text-green-600" /> Exportar Excel
                  </button>

                  {canMakeAdjustment && (
                    <button
                      onClick={openAjusteModal}
                      className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <FaPlusCircle /> Registrar Ajuste Manual
                    </button>
                  )}
                </div>
              </div>

              {/* Ledger Table */}
              <div className={`rounded-2xl border ${ds.cardBg} shadow-sm overflow-hidden flex flex-col`}>
                <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <FaBook className="text-yellow-500" />
                    <h3 className={`font-bold text-sm ${ds.text}`}>Libro Mayor Valorizado de Entradas y Salidas</h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">
                    Total movimientos registrados: {filteredLedgerMovimientos.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={theme === 'dark' ? 'bg-gray-800/80' : 'bg-gray-50/80'}>
                        <th className={thCls}>Fecha / Hora</th>
                        <th className={thCls}>Producto / SKU</th>
                        <th className={thCls}>Variante</th>
                        <th className={thCls}>U.M.</th>
                        <th className={thCls}>Almacén / Lote</th>
                        <th className={thCls}>Movimiento</th>
                        <th className={`${thCls} text-right`}>Cantidad</th>
                        <th className={`${thCls} text-right`}>Costo Unit.</th>
                        <th className={`${thCls} text-right`}>Costo Total</th>
                        <th className={`${thCls} text-right`}>Saldo Físico</th>
                        <th className={`${thCls} text-right`}>Costo Prom.</th>
                        <th className={`${thCls} text-right`}>Saldo Valorizado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLedger.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-12 text-center text-gray-400 italic">
                            No se encontraron movimientos con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        paginatedLedger.map(m => {
                          const badge = MOVEMENT_TYPE_BADGES[m.tipoMovimiento] || { color: 'gray', label: m.tipoMovimiento };
                          const isPositive = (parseFloat(m.cantidad) || 0) >= 0;
                          return (
                            <tr key={m.id} className={`hover:${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'} transition-colors`}>
                              <td className={`${tdCls} whitespace-nowrap text-gray-400 font-mono text-[11px]`}>
                                {m.fecha}
                              </td>
                              <td className={tdCls}>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">{m.productoNombre}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{m.sku}</div>
                              </td>
                              <td className={`${tdCls} text-gray-500`}>
                                {m.variante || '-'}
                              </td>
                              <td className={tdCls}>
                                <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-gray-200 dark:bg-gray-700">
                                  {m.unidadMedida || 'NIU'}
                                </span>
                              </td>
                              <td className={tdCls}>
                                <div className="font-medium">{m.almacenNombre}</div>
                                <div className="text-[10px] text-gray-400">{m.loteNombre}</div>
                              </td>
                              <td className={tdCls}>
                                <Badge color={badge.color} size="sm">
                                  {badge.label}
                                </Badge>
                              </td>
                              <td className={`${tdCls} text-right font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? `+${m.cantidad}` : m.cantidad}
                              </td>
                              <td className={`${tdCls} text-right`}>
                                S/. {fmt.format(m.costoUnitario || 0)}
                              </td>
                              <td className={`${tdCls} text-right font-semibold text-gray-600 dark:text-gray-300`}>
                                S/. {fmt.format(m.costoTotal || 0)}
                              </td>
                              <td className={`${tdCls} text-right font-bold text-gray-800 dark:text-gray-200`}>
                                {m.saldoFisico}
                              </td>
                              <td className={`${tdCls} text-right text-gray-500`}>
                                S/. {fmt.format(m.costoPromedioPonderado || 0)}
                              </td>
                              <td className={`${tdCls} text-right font-bold text-indigo-500 dark:text-indigo-400`}>
                                S/. {fmt.format(m.saldoValorizado || 0)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Strict 25-record pagination */}
                <div className={`flex items-center justify-between px-5 py-3 border-t ${ds.divider} flex-wrap gap-2`}>
                  <span className={`text-xs ${ds.muted}`}>
                    Mostrando <strong className={ds.text}>
                      {filteredLedgerMovimientos.length === 0 ? 0 : (ledgerPage - 1) * PAGE_SIZE + 1}-
                      {Math.min(ledgerPage * PAGE_SIZE, filteredLedgerMovimientos.length)}
                    </strong> de <strong className={ds.text}>{filteredLedgerMovimientos.length}</strong> movimientos
                  </span>
                  {Math.ceil(filteredLedgerMovimientos.length / PAGE_SIZE) > 1 && (
                    <div className="flex items-center gap-1.5">
                      <Btn
                        variant="secondary"
                        size="sm"
                        disabled={ledgerPage === 1}
                        onClick={() => setLedgerPage(ledgerPage - 1)}
                      >
                        ‹ Anterior
                      </Btn>
                      <span className="text-xs font-bold px-2">{ledgerPage} / {Math.ceil(filteredLedgerMovimientos.length / PAGE_SIZE)}</span>
                      <Btn
                        variant="secondary"
                        size="sm"
                        disabled={ledgerPage >= Math.ceil(filteredLedgerMovimientos.length / PAGE_SIZE)}
                        onClick={() => setLedgerPage(ledgerPage + 1)}
                      >
                        Siguiente ›
                      </Btn>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ══════════ TAB 2: BALANCE POR PRODUCTO (SNAPSHOT) ══════════ */}
          {activeTab === 'snapshot' && (
            <>
              {/* Filters */}
              <div className={`p-4 rounded-2xl border ${ds.cardBg} flex gap-3 items-end flex-wrap shadow-sm`}>
                <div className="flex-1 min-w-[180px]">
                  <label className={`block text-xs font-bold uppercase mb-1 tracking-wider ${ds.muted}`}>Sucursal</label>
                  <select
                    value={filterSucursal}
                    onChange={e => { setFilterSucursal(e.target.value); setFilterAlmacen(''); setFilterLote(''); }}
                    disabled={!isMaster}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls} ${!isMaster ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {isMaster && <option value="">Todas las Sucursales</option>}
                    {allowedSucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className={`block text-xs font-bold uppercase mb-1 tracking-wider ${ds.muted}`}>Almacén</label>
                  <select
                    value={filterAlmacen}
                    onChange={e => { setFilterAlmacen(e.target.value); setFilterLote(''); }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                  >
                    <option value="">Todos los Almacenes</option>
                    {allowedAlmacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className={`block text-xs font-bold uppercase mb-1 tracking-wider ${ds.muted}`}>Lote</label>
                  <select
                    value={filterLote}
                    onChange={e => setFilterLote(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                  >
                    <option value="">Todos los Lotes</option>
                    {allowedLotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportSnapshotExcel(reportData)}
                    disabled={reportData.length === 0}
                    className={`px-3.5 py-2 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                      theme === 'dark' ? 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50`}
                  >
                    <FaFileExcel className="text-green-600" /> Excel
                  </button>
                  <button
                    onClick={() => {
                      setSaveTitle(`Kardex Cierre - ${new Date().toLocaleDateString('es-PE')}`);
                      setSavingModal(true);
                    }}
                    disabled={reportData.length === 0}
                    className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <FaSave /> Guardar Reporte
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className={`rounded-2xl border ${ds.cardBg} shadow-sm overflow-hidden flex flex-col`}>
                <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-bold text-sm ${ds.text}`}>Resultados del Balance</h3>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    Total Valorizado: S/. {fmt.format(totalValorizacionSnapshot)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={theme === 'dark' ? 'bg-gray-800/80' : 'bg-gray-50/80'}>
                        <th className={thCls}>Producto</th>
                        <th className={thCls}>U.M.</th>
                        <th className={`${thCls} text-right`}>Precio</th>
                        <th className={`${thCls} text-right`}>Costo</th>
                        <th className={`${thCls} text-right`}>Stock Sist.</th>
                        <th className={`${thCls} text-center`}>Diferencia Conteo</th>
                        <th className={`${thCls} text-right`}>Valorización</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSnapshot.map(p => {
                        const isDec = p.permite_decimales;
                        return (
                          <tr key={p.id} className={`hover:${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'} transition-colors`}>
                            <td className={tdCls}>
                              <div className="font-semibold">{p.nombre}</div>
                              {p.codigoBarras && <div className="text-[10px] text-gray-500 mt-0.5">{p.codigoBarras}</div>}
                            </td>
                            <td className={tdCls}>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-200 dark:bg-gray-700">
                                {p.unidadMedida || 'NIU'}
                              </span>
                            </td>
                            <td className={`${tdCls} text-right`}>S/. {fmt.format(p.precio)}</td>
                            <td className={`${tdCls} text-right text-gray-500`}>S/. {fmt.format(p.costo || 0)}</td>
                            <td className={`${tdCls} text-right font-semibold ${p.stock <= 0 ? 'text-red-500' : ''}`}>
                              {isDec ? `${fmtKg.format(p.stock)} ${p.unidadMedida}` : p.stock}
                            </td>
                            <td className={`${tdCls} text-center`}>
                              <input
                                type="number"
                                step={isDec ? '0.001' : '1'}
                                placeholder="0"
                                value={diferencias[p.id] ?? ''}
                                onChange={e => setDiferencias({ ...diferencias, [p.id]: e.target.value })}
                                className={`w-20 px-2 py-1 text-center border rounded-lg text-xs font-bold outline-none ${ds.inputCls} ${
                                  diferencias[p.id] && parseFloat(diferencias[p.id]) !== 0
                                    ? (parseFloat(diferencias[p.id]) > 0 ? 'border-green-500 text-green-600' : 'border-red-500 text-red-500')
                                    : ''
                                }`}
                              />
                            </td>
                            <td className={`${tdCls} text-right font-bold text-indigo-500 dark:text-indigo-400`}>
                              S/. {fmt.format(p.costo * (parseFloat(p.stock) + (parseFloat(diferencias[p.id]) || 0)))}
                            </td>
                          </tr>
                        );
                      })}
                      {reportData.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-gray-400 italic">
                            No se encontraron productos para los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 25-record pagination */}
                <div className={`flex items-center justify-between px-5 py-3 border-t ${ds.divider} flex-wrap gap-2`}>
                  <span className={`text-xs ${ds.muted}`}>
                    Mostrando <strong className={ds.text}>
                      {reportData.length === 0 ? 0 : (snapshotPage - 1) * PAGE_SIZE + 1}-
                      {Math.min(snapshotPage * PAGE_SIZE, reportData.length)}
                    </strong> de <strong className={ds.text}>{reportData.length}</strong> productos
                  </span>
                  {Math.ceil(reportData.length / PAGE_SIZE) > 1 && (
                    <div className="flex items-center gap-1.5">
                      <Btn
                        variant="secondary"
                        size="sm"
                        disabled={snapshotPage === 1}
                        onClick={() => setSnapshotPage(snapshotPage - 1)}
                      >
                        ‹ Anterior
                      </Btn>
                      <span className="text-xs font-bold px-2">{snapshotPage} / {Math.ceil(reportData.length / PAGE_SIZE)}</span>
                      <Btn
                        variant="secondary"
                        size="sm"
                        disabled={snapshotPage >= Math.ceil(reportData.length / PAGE_SIZE)}
                        onClick={() => setSnapshotPage(snapshotPage + 1)}
                      >
                        Siguiente ›
                      </Btn>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ══════════ TAB 3: HISTORIAL DE REPORTES GUARDADOS ══════════ */}
          {activeTab === 'historial' && (
            <div className="grid gap-3">
              {kardexHistorial.length === 0 ? (
                <div className={`p-10 rounded-2xl border text-center ${ds.cardFlat}`}>
                  <FaHistory className="mx-auto text-4xl text-gray-300 mb-3" />
                  <p className={ds.muted}>No hay reportes de Kardex guardados en el historial.</p>
                </div>
              ) : (
                kardexHistorial.map(report => (
                  <div
                    key={report.id}
                    className={`p-4 rounded-2xl border ${ds.cardBg} shadow-sm flex items-center justify-between gap-4 transition-all hover:border-yellow-500/50`}
                  >
                    <div className="flex flex-col gap-1">
                      <h4 className={`font-bold text-base ${ds.text}`}>{report.titulo}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>🗓️ {report.fecha}</span>
                        <span>👤 {report.usuarioResponsable}</span>
                        <span>🔍 {report.filtros}</span>
                      </div>
                      <div className="text-indigo-500 font-bold mt-0.5 text-xs">
                        Total Valorizado: S/. {fmt.format(report.totalValorizacion)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(report)}
                        className={`p-2 rounded-xl border transition-colors ${
                          theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-600'
                        }`}
                        title="Editar Reporte"
                      >
                        <FaPencilAlt size={12} />
                      </button>
                      <button
                        onClick={() => setViewingReport(report)}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <FaEye size={12} /> Ver
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* ══════════ MODAL: REGISTRAR AJUSTE MANUAL DE KARDEX ══════════ */}
      {showAjusteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl p-5 flex flex-col gap-4 ${ds.cardBg} border`}>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <FaExchangeAlt className="text-yellow-500" />
                <h3 className={`font-bold text-base ${ds.text}`}>Registrar Ajuste Manual de Kardex</h3>
              </div>
              <button onClick={() => setShowAjusteModal(false)} className="text-gray-400 hover:text-red-400">
                <FaTimes />
              </button>
            </div>

            <p className={`text-xs ${ds.muted}`}>
              Este ajuste alterará el stock del inventario y quedará registrado de forma inmutable en el Libro Diario Oficial.
            </p>

            {ajusteError && <p className="text-red-400 text-xs font-semibold bg-red-500/10 p-2 rounded-lg">{ajusteError}</p>}
            {ajusteSuccess && (
              <p className="text-green-500 text-xs font-bold bg-green-500/10 p-2 rounded-lg flex items-center gap-2">
                <FaCheckCircle /> {ajusteSuccess}
              </p>
            )}

            <form onSubmit={handleConfirmAjuste} className="space-y-3">
              {/* Producto */}
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Producto a Ajustar</label>
                <select
                  value={ajusteForm.productoId}
                  onChange={e => handleAjusteProductoChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                  required
                >
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock actual: {p.stock} {p.unidadMedida})</option>
                  ))}
                </select>
              </div>

              {/* Variante (if product has variants) */}
              {selectedProdForAjuste?.variantes?.length > 0 && (
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Variante Específica</label>
                  <select
                    value={ajusteForm.varianteId}
                    onChange={e => setAjusteForm(p => ({ ...p, varianteId: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                  >
                    {selectedProdForAjuste.variantes.map(v => (
                      <option key={v.id} value={v.id}>
                        Talla: {v.talla} / Color: {v.color} (SKU: {v.sku} - Stock: {v.stock})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Almacén & Lote */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Almacén</label>
                  <select
                    value={ajusteForm.almacenId}
                    onChange={e => setAjusteForm(p => ({ ...p, almacenId: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                  >
                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Lote</label>
                  <select
                    value={ajusteForm.loteId}
                    onChange={e => setAjusteForm(p => ({ ...p, loteId: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                  >
                    {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
              </div>

              {/* Tipo Ajuste & Cantidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Tipo de Ajuste</label>
                  <select
                    value={ajusteForm.tipoAjuste}
                    onChange={e => setAjusteForm(p => ({ ...p, tipoAjuste: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold ${
                      ajusteForm.tipoAjuste === 'AJUSTE_POSITIVO' ? 'text-green-500' : 'text-red-500'
                    } ${ds.inputCls}`}
                  >
                    <option value="AJUSTE_POSITIVO">+ Entrada (Sobrante / Inventario)</option>
                    <option value="AJUSTE_NEGATIVO">- Salida (Merma / Daño / Faltante)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>
                    Cantidad ({selectedProdForAjuste?.unidadMedida || 'NIU'})
                  </label>
                  <input
                    type="number"
                    step={selectedProdForAjuste?.permite_decimales ? '0.001' : '1'}
                    min={selectedProdForAjuste?.permite_decimales ? '0.001' : '1'}
                    value={ajusteForm.cantidad}
                    onChange={e => setAjusteForm(p => ({ ...p, cantidad: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${ds.inputCls}`}
                    required
                  />
                </div>
              </div>

              {/* Costo Unitario & Motivo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Costo Unitario (S/.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ajusteForm.costoUnitario}
                    onChange={e => setAjusteForm(p => ({ ...p, costoUnitario: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Motivo / Justificación</label>
                  <input
                    type="text"
                    value={ajusteForm.motivo}
                    onChange={e => setAjusteForm(p => ({ ...p, motivo: e.target.value }))}
                    placeholder="ej. Merma por humedad..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                    required
                  />
                </div>
              </div>

              {/* Password Confirmation */}
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 text-yellow-500`}>
                  Confirmar con tu Contraseña *
                </label>
                <input
                  type="password"
                  value={ajusteForm.password}
                  onChange={e => setAjusteForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Contraseña de usuario"
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Btn type="button" variant="secondary" fullWidth onClick={() => setShowAjusteModal(false)}>
                  Cancelar
                </Btn>
                <Btn type="submit" variant="primary" fullWidth className="bg-yellow-500! text-black! hover:bg-yellow-400! font-bold">
                  Confirmar y Asentar en Kardex
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: GUARDAR REPORTE SNAPSHOT ══════════ */}
      {savingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-5 ${ds.cardBg} border`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`font-bold text-base ${ds.text}`}>Guardar Snapshot de Kardex</h3>
              <button onClick={() => setSavingModal(false)} className="text-gray-400 hover:text-red-400"><FaTimes /></button>
            </div>
            <p className={`text-xs mb-3 ${ds.muted}`}>
              Se guardará una captura del inventario físico actual con los filtros aplicados.
            </p>
            <div className="mb-4">
              <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Título o Descripción</label>
              <input
                type="text"
                autoFocus
                value={saveTitle}
                onChange={e => setSaveTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                placeholder="Ej. Cierre de Mes Febrero"
              />
            </div>
            <div className="flex gap-2">
              <Btn variant="secondary" fullWidth onClick={() => setSavingModal(false)}>Cancelar</Btn>
              <Btn variant="primary" fullWidth onClick={handleSaveReport} className="bg-yellow-500! text-black!">Guardar</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: VER REPORTE HISTORIAL ══════════ */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${ds.cardBg} border`}>
            <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-t-2xl`}>
              <div>
                <h3 className={`font-bold text-lg ${ds.text}`}>{viewingReport.titulo}</h3>
                <span className="text-xs text-gray-500">Por {viewingReport.usuarioResponsable} el {viewingReport.fecha}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportSnapshotExcel(viewingReport.productos, `${viewingReport.titulo}.xlsx`)}
                  className="px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 bg-white dark:bg-gray-800"
                >
                  <FaFileExcel className="text-green-600" /> Exportar
                </button>
                <button onClick={() => setViewingReport(null)} className="p-1.5 text-gray-400 hover:text-red-400">
                  <FaTimes size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <div className="mb-3 flex justify-between items-center">
                <span className="text-xs text-gray-500">Filtros: {viewingReport.filtros}</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-500">
                  Total: S/. {fmt.format(viewingReport.totalValorizacion)}
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
                    <th className={thCls}>Producto</th>
                    <th className={thCls}>U.M.</th>
                    <th className={`${thCls} text-right`}>Precio</th>
                    <th className={`${thCls} text-right`}>Costo</th>
                    <th className={`${thCls} text-right`}>Stock Contado</th>
                    <th className={`${thCls} text-right`}>Dif.</th>
                    <th className={`${thCls} text-right`}>Valorización</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingReport.productos.map((p, i) => (
                    <tr key={i} className="border-t border-gray-200 dark:border-gray-700/50">
                      <td className={tdCls}>{p.nombre}</td>
                      <td className={tdCls}>{p.unidadMedida || 'NIU'}</td>
                      <td className={`${tdCls} text-right`}>S/. {fmt.format(p.precio)}</td>
                      <td className={`${tdCls} text-right text-gray-500`}>S/. {fmt.format(p.costo || 0)}</td>
                      <td className={`${tdCls} text-right font-bold`}>{p.stockFisico ?? p.stock}</td>
                      <td className={`${tdCls} text-right font-bold ${p.diferenciaAplicada > 0 ? 'text-green-500' : p.diferenciaAplicada < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {p.diferenciaAplicada ? (p.diferenciaAplicada > 0 ? `+${p.diferenciaAplicada}` : p.diferenciaAplicada) : '-'}
                      </td>
                      <td className={`${tdCls} text-right font-bold text-indigo-500`}>S/. {fmt.format(p.valorizacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: EDITAR REPORTE HISTORIAL ══════════ */}
      {editingFullReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${ds.cardBg} border`}>
            <div className={`p-4 border-b flex justify-between items-center gap-3 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-t-2xl`}>
              <div className="flex-1">
                <label className={`block text-[11px] font-bold uppercase mb-1 ${ds.muted}`}>Título del Reporte</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none ${ds.inputCls}`}
                />
              </div>
              <div className="flex gap-2">
                <Btn variant="secondary" size="sm" onClick={() => setEditingFullReport(null)}>Cancelar</Btn>
                <Btn variant="primary" size="sm" onClick={handleUpdateFullReport} className="bg-yellow-500! text-black!">Actualizar</Btn>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
                    <th className={thCls}>Producto</th>
                    <th className={thCls}>U.M.</th>
                    <th className={`${thCls} text-right`}>Precio</th>
                    <th className={`${thCls} text-right`}>Costo</th>
                    <th className={`${thCls} text-center`}>Diferencia</th>
                    <th className={`${thCls} text-right`}>Valorización</th>
                  </tr>
                </thead>
                <tbody>
                  {editingFullReport.productos.map((p, i) => {
                    const originalSystemStock = parseFloat(p.stockFisico) - (parseFloat(p.diferenciaAplicada) || 0);
                    return (
                      <tr key={i} className="border-t border-gray-200 dark:border-gray-700/50">
                        <td className={tdCls}>{p.nombre}</td>
                        <td className={tdCls}>{p.unidadMedida || 'NIU'}</td>
                        <td className={`${tdCls} text-right`}>S/. {fmt.format(p.precio)}</td>
                        <td className={`${tdCls} text-right text-gray-500`}>S/. {fmt.format(p.costo || 0)}</td>
                        <td className={`${tdCls} text-center`}>
                          <input
                            type="number"
                            step={p.permite_decimales ? '0.001' : '1'}
                            value={editingDiferencias[p.id] ?? ''}
                            onChange={e => setEditingDiferencias({ ...editingDiferencias, [p.id]: e.target.value })}
                            className={`w-20 px-2 py-1 text-center border rounded-lg text-xs font-bold outline-none ${ds.inputCls}`}
                          />
                        </td>
                        <td className={`${tdCls} text-right font-bold text-indigo-500`}>
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
      )}

    </div>
  );
};

export default Kardex;

