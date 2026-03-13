/**
 * ═══════════════════════════════════════════════════════════════
 *  ERSOFT – Panel de Gráficos (/graficos)
 *  Stack: React + Chart.js v4 (canvas API pura)
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  Chart,
  BarController, BarElement,
  LineController, LineElement, PointElement,
  DoughnutController, PieController, ArcElement,
  CategoryScale, LinearScale,
  Tooltip, Legend, Filler,
} from 'chart.js';
import { useTheme } from '../context/ThemeContext';
import { useInventario } from '../context/InventarioContext';

Chart.register(
  BarController, BarElement,
  LineController, LineElement, PointElement,
  DoughnutController, PieController, ArcElement,
  CategoryScale, LinearScale,
  Tooltip, Legend, Filler
);

// ─── Paleta ────────────────────────────────────────────────────
const P = {
  teal:    '#14b8a6', tealA:  'rgba(20,184,166,0.20)',
  coral:   '#f87171', coralS: '#ef4444',
  blue:    '#3b82f6', blueA:  'rgba(59,130,246,0.20)',
  indigo:  '#6366f1',
  amber:   '#f59e0b',
  green:   '#22c55e',
  purple:  '#a855f7',
  pink:    '#ec4899',
  gridD:   'rgba(255,255,255,0.07)',
  gridL:   'rgba(0,0,0,0.07)',
};

const PIE_COLORS = [P.teal, P.blue, P.indigo, P.amber, P.coral, P.purple, P.pink, P.green];

// ─── Formateo ──────────────────────────────────────────────────
const fmt    = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 });
const fmtS   = (v) => v >= 1000 ? `S/.${(v/1000).toFixed(1)}k` : `S/.${v}`;
const MESES  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ─── Helpers de fecha ──────────────────────────────────────────
const toDate  = (iso) => { try { return new Date(iso); } catch { return null; } };
const inRange = (fecha, desde, hasta) => {
  const d = toDate(fecha);
  if (!d) return false;
  const ds = desde ? new Date(desde + 'T00:00:00') : null;
  const hs = hasta ? new Date(hasta + 'T23:59:59') : null;
  if (ds && d < ds) return false;
  if (hs && d > hs) return false;
  return true;
};
const isoToday = () => new Date().toISOString().slice(0, 10);
const isoMinus = (days) => {
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};
const isoStartYear = () => `${new Date().getFullYear()}-01-01`;

// ─── Opciones base ─────────────────────────────────────────────
const baseOpts = (isDark) => ({
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 350 },
  plugins: {
    legend: {
      labels: {
        color: isDark ? '#e2e8f0' : '#334155',
        font: { family: 'Inter,sans-serif', size: 11 },
        boxWidth: 12, padding: 14,
      },
    },
    tooltip: {
      backgroundColor: isDark ? '#1e293b' : '#fff',
      titleColor:  isDark ? '#94a3b8' : '#64748b',
      bodyColor:   isDark ? '#f1f5f9' : '#1e293b',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      borderWidth: 1, padding: 11, cornerRadius: 10,
    },
  },
  scales: {
    x: { ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }, grid: { color: isDark ? P.gridD : P.gridL } },
    y: { ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 }, callback: fmtS }, grid: { color: isDark ? P.gridD : P.gridL } },
  },
});

// ─── Carga de datos desde localStorage ─────────────────────────
const load = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };

// ══════════════════════════════════════════════════════════════
//  FUNCIONES DE DATOS LOGICOS
// ══════════════════════════════════════════════════════════════

// [#] RESUMEN GENERAL
const calcVentasMensuales = (comp) => {
  const totales = new Array(12).fill(0);
  comp.filter(c => c.estado !== 'Anulado').forEach(c => { const d = toDate(c.fecha); if (d) totales[d.getMonth()] += c.total || 0; });
  if (totales.every(v => v === 0)) return { labels: MESES, data: [3200,4100,3800,5200,4600,6100,5500,7200,6300,8100,7400,9200] };
  return { labels: MESES, data: totales };
};

const calcCategorias = (comp) => {
  const map = {};
  comp.filter(c => c.estado !== 'Anulado').forEach(c => {
    (c.items || []).forEach(item => {
      const cat = item.categoria || item._type || 'Sin categoría';
      map[cat] = (map[cat] || 0) + (item.qty || 1) * (item.precio || 0);
    });
  });
  const entries = Object.entries(map).sort((a,b) => b[1]-a[1]);
  if (!entries.length) return { labels: ['Costura','Tejido','Bordado','Diseño','Otros'], data: [4200, 3100, 2600, 1900, 800] };
  return { labels: entries.map(e => e[0]), data: entries.map(e => Math.round(e[1])) };
};

const calcAnulados = (comp) => {
  const counts = new Array(12).fill(0);
  comp.filter(c => c.estado === 'Anulado' || c.estado === 'anulado').forEach(c => {
    const d = toDate(c.fecha); if (d) counts[d.getMonth()]++;
  });
  if (counts.every(v => v === 0)) return { labels: MESES, data: [1,0,2,1,3,0,1,2,0,1,2,1] };
  return { labels: MESES, data: counts };
};

const calcTicketPromedio = (comp) => {
  const sums = new Array(12).fill(0);
  const cnts = new Array(12).fill(0);
  comp.filter(c => c.estado !== 'Anulado').forEach(c => {
    const d = toDate(c.fecha);
    if (d) { sums[d.getMonth()] += c.total || 0; cnts[d.getMonth()]++; }
  });
  const data = sums.map((s, i) => cnts[i] ? Math.round(s / cnts[i]) : 0);
  if (data.every(v => v === 0)) return { labels: MESES, data: [480,510,430,560,590,620,550,680,640,710,695,760] };
  return { labels: MESES, data };
};

const calcClientesNuevos = () => {
  const clients = load('ersoft_clients');
  const counts = new Array(12).fill(0);
  clients.forEach(c => {
    const d = toDate(c.createdAt || c.fecha);
    if (d) counts[d.getMonth()]++;
  });
  if (counts.every(v => v === 0)) return { labels: MESES, data: [5,8,6,11,9,14,12,17,13,19,16,22] };
  return { labels: MESES, data: counts };
};

// [#] INVENTARIO Y VENTAS
const calcTopProductos = (comp) => {
  const map = {};
  comp.filter(c => c.estado !== 'Anulado').forEach(c => {
    (c.items || []).forEach(item => {
      if (item.tipo === 'Producto' || !item.tipo) {
        const key = item.nombre || 'Desconocido';
        map[key] = (map[key] || 0) + (item.qty || 1);
      }
    });
  });
  const entries = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 10);
  return { labels: entries.map(e => e[0].substring(0,25)), data: entries.map(e => e[1]) };
};

const calcProdVsServ = (comp) => {
  let prod = 0, serv = 0;
  comp.filter(c => c.estado !== 'Anulado').forEach(c => {
    (c.items || []).forEach(item => {
      const amt = (item.qty || 1) * (item.precio || 0);
      if (item.tipo === 'Servicio') serv += amt;
      else prod += amt;
    });
  });
  return { labels: ['Productos', 'Servicios'], data: [prod, serv] };
};

const getStockMuerto = (comp, productos) => {
  const sold = new Set();
  comp.filter(c => c.estado !== 'Anulado').forEach(c => {
    (c.items || []).forEach(it => {
      if (it.tipo === 'Producto') sold.add(it.id || it.nombre);
    });
  });
  return productos
    .filter(p => (p.stock || 0) > 0 && !sold.has(p.id) && !sold.has(p.nombre))
    .sort((a, b) => b.stock - a.stock);
};

// [#] FINANZAS Y CLIENTES
const calcMargenUtilidad = (comp) => {
  const ingresos = new Array(12).fill(0);
  const costos = new Array(12).fill(0);
  
  comp.filter(c => c.estado !== 'Anulado').forEach(c => {
    const d = toDate(c.fecha);
    if (!d) return;
    const m = d.getMonth();
    
    let ing = 0, cost = 0;
    (c.items || []).forEach(it => {
      const q = it.qty || 1;
      ing += q * (it.precio || 0);
      cost += q * (parseFloat(it.costo) || 0);
    });
    
    ingresos[m] += ing;
    costos[m] += cost;
  });
  
  if (ingresos.every(v => v === 0)) {
     return { labels: MESES, ingresos: [3200,4100,3800,5200,4600,6100,5500,7200,6300,8100,7400,9200], costos: [1500, 2000, 1900, 2200, 2600, 3100, 2500, 3200, 3300, 4100, 3400, 4200] };
  }
  
  const utilidad = ingresos.map((v, i) => v - costos[i]);
  return { labels: MESES, ingresos, costos, utilidad };
};

const calcMetodosPago = (comp) => {
  const map = {};
  comp.filter(c => c.estado !== 'Anulado').forEach(c => {
    const m = c.metodoPago || 'cash';
    map[m] = (map[m] || 0) + (c.total || 0);
  });
  const labelsMap = { digital: 'Billetera Digital', bank: 'Transferencia', cash: 'Efectivo', pos: 'POS' };
  const entries = Object.entries(map).sort((a,b) => b[1]-a[1]);
  return { labels: entries.map(e => labelsMap[e[0]] || e[0]), data: entries.map(e => e[1]) };
};

const calcTopClientes = (comp) => {
  const map = {};
  comp.filter(c => c.estado !== 'Anulado').forEach(c => {
    const clientName = c.cliente ? `${c.cliente.nombre || ''} ${c.cliente.apellidos || ''}`.trim() : 'Consumidor final';
    map[clientName] = (map[clientName] || 0) + (c.total || 0);
  });
  const entries = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 5);
  return { labels: entries.map(e => e[0].substring(0, 20)), data: entries.map(e => e[1]) };
};

// ─── Filter ──────────────────────────────────────────────────
const filterComp = (comp, desde, hasta) =>
  desde || hasta ? comp.filter(c => inRange(c.fecha, desde, hasta)) : comp;

// ─── Sub-componentes UI ────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, isDark }) => (
  <div className={`flex flex-col rounded-2xl border p-4 gap-2 min-h-[300px]
    ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
    <div>
      <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{title}</h3>
      {subtitle && <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{subtitle}</p>}
    </div>
    <div className="flex-1 relative">{children}</div>
  </div>
);

const KPI = ({ label, value, accent, isDark }) => (
  <div className={`rounded-xl border px-4 py-3 flex flex-col gap-0.5
    ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
    <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
    <span className={`text-lg font-extrabold ${accent}`}>{value}</span>
  </div>
);

// ─── Presets y Constantes ───────────────────────────────────────
const PRESETS = [
  { label: '7d',       desde: () => isoMinus(7),  hasta: isoToday },
  { label: '30d',      desde: () => isoMinus(30), hasta: isoToday },
  { label: '3 meses',  desde: () => isoMinus(90), hasta: isoToday },
  { label: 'Este año', desde: isoStartYear,        hasta: isoToday },
  { label: 'Todo',     desde: () => '',            hasta: () => '' },
];
const TABS = ['Resumen General', 'Inventario y Ventas', 'Finanzas y Clientes'];

// ════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════
const Graficos = () => {
  const { theme } = useTheme();
  const { productos } = useInventario();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState(0);
  const [desde, setDesde] = useState(isoStartYear());
  const [hasta, setHasta] = useState(isoToday());
  const [activePreset, setActivePreset] = useState(3); // "Este año"

  const applyPreset = (idx) => {
    const p = PRESETS[idx];
    setDesde(p.desde()); setHasta(p.hasta());
    setActivePreset(idx);
  };

  // Refs de todas las pestañas
  const refs = {
    bar:    { canvas: useRef(null), chart: useRef(null) },
    pie:    { canvas: useRef(null), chart: useRef(null) },
    donut:  { canvas: useRef(null), chart: useRef(null) },
    anul:   { canvas: useRef(null), chart: useRef(null) },
    avg:    { canvas: useRef(null), chart: useRef(null) },
    cli:    { canvas: useRef(null), chart: useRef(null) },
    topProd:{ canvas: useRef(null), chart: useRef(null) },
    prodServ:{ canvas: useRef(null), chart: useRef(null) },
    margen: { canvas: useRef(null), chart: useRef(null) },
    metodos:{ canvas: useRef(null), chart: useRef(null) },
    topCli: { canvas: useRef(null), chart: useRef(null) },
  };

  const destroy = (ref) => { if (ref.chart.current) { ref.chart.current.destroy(); ref.chart.current = null; } };
  const destroyAll = () => Object.values(refs).forEach(destroy);

  const allComp = useMemo(() => load('ersoft_comprobantes'), []);
  const comp    = useMemo(() => filterComp(allComp, desde, hasta), [allComp, desde, hasta]);

  const kpis = useMemo(() => {
    const nVentas  = comp.filter(c => c.estado !== 'Anulado');
    const total    = nVentas.reduce((s, c) => s + (c.total || 0), 0);
    const nAnul    = comp.filter(c => c.estado === 'Anulado').length;
    const avg      = nVentas.length ? Math.round(total / nVentas.length) : 0;
    
    let totalCostos = 0;
    nVentas.forEach(c => {
      (c.items || []).forEach(it => {
        totalCostos += (it.qty || 1) * (parseFloat(it.costo) || 0);
      });
    });

    const stockC   = productos.filter(p => (p.stock ?? 0) <= 0).length;
    const stockW   = productos.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;
    const stockMuertoVal = getStockMuerto(comp, productos).length;
    return { total, nVentas: nVentas.length, nAnul, avg, stockC, stockW, totalCostos, stockMuertoVal };
  }, [comp, productos]);

  const stockMuertoList = useMemo(() => activeTab === 1 ? getStockMuerto(comp, productos) : [], [comp, productos, activeTab]);

  const barColors = (data, highlight) => data.map((v) => v === Math.max(...data) ? highlight : P.blue + 'bb');

  const drawCharts = useCallback(() => {
    destroyAll();
    const opts = baseOpts(isDark);
    const noScales = { ...opts, scales: {} };

    // ── Resumen General ──
    if (activeTab === 0) {
      if (refs.bar.canvas.current) {
        const v = calcVentasMensuales(comp);
        refs.bar.chart.current = new Chart(refs.bar.canvas.current, {
          type: 'bar',
          data: { labels: v.labels, datasets: [{ label: 'Ventas (S/.)', data: v.data, backgroundColor: barColors(v.data, P.teal), borderRadius: 7 }] },
          options: { ...opts, plugins: { ...opts.plugins, legend: { display: false }, tooltip: { ...opts.plugins.tooltip, callbacks: { label: ctx => ` ${fmt.format(ctx.raw)}` } } } },
        });
      }
      if (refs.pie.canvas.current) {
        const cat = calcCategorias(comp);
        refs.pie.chart.current = new Chart(refs.pie.canvas.current, {
          type: 'pie',
          data: { labels: cat.labels, datasets: [{ data: cat.data, backgroundColor: PIE_COLORS.slice(0, cat.labels.length), borderColor: isDark ? '#1e293b' : '#fff', borderWidth: 2 }] },
          options: { ...noScales, plugins: { ...noScales.plugins, tooltip: { ...noScales.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.label}: ${fmt.format(ctx.raw)}` } } } },
        });
      }
      if (refs.donut.canvas.current) {
        let ok = 0, warn = 0, crit = 0;
        productos.forEach(p => { const s = p.stock ?? 0; if (s <= 0) crit++; else if (s <= 5) warn++; else ok++; });
        if (!ok && !warn && !crit) { ok = 18; warn = 7; crit = 3; }
        refs.donut.chart.current = new Chart(refs.donut.canvas.current, {
          type: 'doughnut',
          data: { labels: ['Stock OK','Reordenar','Sin Stock'], datasets: [{ data: [ok, warn, crit], backgroundColor: [P.green, P.amber, P.coralS], borderColor: isDark ? '#1e293b' : '#fff', borderWidth: 3 }] },
          options: { ...noScales, cutout: '68%', plugins: { ...noScales.plugins, tooltip: { ...noScales.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} prod.` } } } },
        });
      }
      if (refs.anul.canvas.current) {
        const an = calcAnulados(comp);
        refs.anul.chart.current = new Chart(refs.anul.canvas.current, {
          type: 'bar',
          data: { labels: an.labels, datasets: [{ label: 'Anulados', data: an.data, backgroundColor: P.coral + 'cc', borderRadius: 6 }] },
          options: { ...opts, plugins: { ...opts.plugins, legend: { display: false } } },
        });
      }
      if (refs.avg.canvas.current) {
        const ap = calcTicketPromedio(comp);
        refs.avg.chart.current = new Chart(refs.avg.canvas.current, {
          type: 'line',
          data: { labels: ap.labels, datasets: [{ label: 'Ticket Promedio (S/.)', data: ap.data, borderColor: P.indigo, backgroundColor: 'rgba(99,102,241,0.12)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: P.indigo, borderWidth: 2 }] },
          options: { ...opts, plugins: { ...opts.plugins, legend: { display: false }, tooltip: { ...opts.plugins.tooltip, callbacks: { label: ctx => ` ${fmt.format(ctx.raw)}` } } } },
        });
      }
      if (refs.cli.canvas.current) {
        const cl = calcClientesNuevos();
        refs.cli.chart.current = new Chart(refs.cli.canvas.current, {
          type: 'bar',
          data: { labels: cl.labels, datasets: [{ label: 'Clientes Nuevos', data: cl.data, backgroundColor: cl.data.map((v) => v === Math.max(...cl.data) ? P.teal : P.teal + '77'), borderRadius: 7 }] },
          options: { ...opts, plugins: { ...opts.plugins, legend: { display: false } } },
        });
      }
    }

    // ── Inventario y Ventas ──
    if (activeTab === 1) {
      if (refs.topProd.canvas.current) {
        const tp = calcTopProductos(comp);
        refs.topProd.chart.current = new Chart(refs.topProd.canvas.current, {
          type: 'bar',
          data: { labels: tp.labels, datasets: [{ label: 'Unidades Vendidas', data: tp.data, backgroundColor: P.teal, borderRadius: 4 }] },
          options: { ...opts, indexAxis: 'y', plugins: { ...opts.plugins, legend: { display: false } } },
        });
      }
      if (refs.prodServ.canvas.current) {
        const ps = calcProdVsServ(comp);
        refs.prodServ.chart.current = new Chart(refs.prodServ.canvas.current, {
          type: 'doughnut',
          data: { labels: ps.labels, datasets: [{ data: ps.data, backgroundColor: [P.blue, P.purple], borderColor: isDark ? '#1e293b' : '#fff', borderWidth: 2 }] },
          options: { ...noScales, cutout: '65%', plugins: { ...noScales.plugins, tooltip: { ...noScales.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.label}: ${fmt.format(ctx.raw)}` } } } },
        });
      }
    }

    // ── Finanzas y Clientes ──
    if (activeTab === 2) {
      if (refs.margen.canvas.current) {
        const mg = calcMargenUtilidad(comp);
        refs.margen.chart.current = new Chart(refs.margen.canvas.current, {
          type: 'line',
          data: {
            labels: mg.labels,
            datasets: [
              { label: 'Utilidad Real (Neta)', data: mg.utilidad, borderColor: P.green, backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2 },
              { label: 'Ingresos Brutos', data: mg.ingresos, borderColor: P.blue, borderDash: [5,5], fill: false, tension: 0.3, pointRadius: 0, borderWidth: 2 },
              { label: 'Costos Acumulados', data: mg.costos, borderColor: P.coral, borderDash: [5,5], fill: false, tension: 0.3, pointRadius: 0, borderWidth: 2 },
            ]
          },
          options: { ...opts, plugins: { ...opts.plugins, tooltip: { ...opts.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt.format(ctx.raw)}` } } }, scales: { x: opts.scales.x, y: { ...opts.scales.y, ticks: { ...opts.scales.y.ticks, callback: fmtS } } } },
        });
      }
      if (refs.metodos.canvas.current) {
        const mp = calcMetodosPago(comp);
        refs.metodos.chart.current = new Chart(refs.metodos.canvas.current, {
          type: 'pie',
          data: { labels: mp.labels, datasets: [{ data: mp.data, backgroundColor: PIE_COLORS.slice(0, mp.labels.length).reverse(), borderColor: isDark ? '#1e293b' : '#fff', borderWidth: 2 }] },
          options: { ...noScales, plugins: { ...noScales.plugins, tooltip: { ...noScales.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.label}: ${fmt.format(ctx.raw)}` } } } },
        });
      }
      if (refs.topCli.canvas.current) {
        const tc = calcTopClientes(comp);
        refs.topCli.chart.current = new Chart(refs.topCli.canvas.current, {
          type: 'bar',
          data: { labels: tc.labels, datasets: [{ label: 'Monto Total Comprado (S/.)', data: tc.data, backgroundColor: P.indigo, borderRadius: 4 }] },
          options: { ...opts, indexAxis: 'y', plugins: { ...opts.plugins, legend: { display: false }, tooltip: { ...opts.plugins.tooltip, callbacks: { label: ctx => ` ${fmt.format(ctx.raw)}` } } }, scales: { x: { ...opts.scales.x, ticks: { ...opts.scales.x.ticks, callback: fmtS } }, y: opts.scales.y } },
        });
      }
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, comp, productos, activeTab]);

  useEffect(() => {
    drawCharts();
    return () => { destroyAll(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawCharts]);

  const pageBg  = isDark ? 'bg-[#313b48]' : 'bg-[#d6d0d4]';
  const inp     = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800';
  const btnBase = `px-3 py-1.5 rounded-full text-xs font-semibold border transition-all`;
  const btnAct  = isDark ? 'bg-teal-500 text-white border-teal-500' : 'bg-teal-600 text-white border-teal-600';
  const btnIdle = isDark ? 'border-gray-600 text-gray-300 hover:border-teal-400' : 'border-gray-300 text-gray-600 hover:border-teal-500';

  return (
    <div className={`flex flex-col gap-4 min-h-full -m-6 p-6 ${pageBg}`}>

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Panel de Estadísticas Avanzadas
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Datos en tiempo real · filtra por rango de fechas
          </p>
        </div>
      </div>

      {/* ── Barra de filtro de fechas ── */}
      <div className={`flex flex-wrap items-center gap-2 rounded-2xl border p-3
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <span className={`text-xs font-semibold uppercase tracking-wider mr-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          📅 Rango:
        </span>
        {PRESETS.map((p, i) => (
          <button key={p.label} onClick={() => applyPreset(i)} className={`${btnBase} ${i === activePreset ? btnAct : btnIdle}`}>
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-auto">
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Desde</span>
          <input type="date" value={desde} onChange={e => { setDesde(e.target.value); setActivePreset(-1); }} className={`text-xs px-2 py-1.5 border rounded-lg outline-none ${inp}`} />
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Hasta</span>
          <input type="date" value={hasta} onChange={e => { setHasta(e.target.value); setActivePreset(-1); }} className={`text-xs px-2 py-1.5 border rounded-lg outline-none ${inp}`} />
        </div>
      </div>

      {/* ── Tabs (Pestañas) ── */}
      <div className="flex gap-2 border-b border-gray-300 dark:border-gray-600 mt-2">
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-sm transition-colors ${
              activeTab === i
                ? (isDark ? 'bg-gray-800 text-teal-400 border-t-[3px] border-l border-r border-gray-700' : 'bg-white text-teal-600 border-t-[3px] border-l border-r border-gray-200 shadow-sm')
                : (isDark ? 'text-gray-400 hover:text-gray-200 border-t-[3px] border-transparent' : 'text-gray-500 hover:text-gray-800 border-t-[3px] border-transparent')
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── KPIs Generales (Siempre visibles) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-2">
        <KPI label="Total Vendido"   value={fmt.format(kpis.total)}  accent="text-teal-500"  isDark={isDark} />
        {activeTab === 2 ? (
          <KPI label="Ganancia Neta" value={fmt.format(kpis.total - kpis.totalCostos)} accent="text-green-500" isDark={isDark} />
        ) : (
          <KPI label="Ticket Promedio" value={fmt.format(kpis.avg)} accent="text-indigo-400" isDark={isDark} />
        )}
        <KPI label="Nº Ventas"       value={kpis.nVentas}             accent="text-blue-500"  isDark={isDark} />
        
        {activeTab === 1 ? (
          <KPI label="Stock Muerto"  value={`${kpis.stockMuertoVal} prod.`} accent="text-purple-400" isDark={isDark} />
        ) : (
          <KPI label="Anulados"      value={kpis.nAnul}               accent="text-red-400"   isDark={isDark} />
        )}
        <KPI label="Stock Crítico"   value={`${kpis.stockC} prod.`}   accent="text-red-500"   isDark={isDark} />
        <KPI label="A Reordenar"     value={`${kpis.stockW} prod.`}   accent="text-amber-400" isDark={isDark} />
      </div>

      {/* ── Vistas por Tab ── */}
      
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
          <ChartCard title="Ventas Mensuales" subtitle="Ingresos por mes · resaltado = mejor mes" isDark={isDark}><canvas ref={refs.bar.canvas} /></ChartCard>
          <ChartCard title="Categorías Vendidas" subtitle="Distribución de ingresos por categoría" isDark={isDark}><canvas ref={refs.pie.canvas} /></ChartCard>
          <ChartCard title="Estado Crítico de Stock" subtitle="Verde OK · Amarillo Reordenar · Rojo Sin stock" isDark={isDark}><canvas ref={refs.donut.canvas} /></ChartCard>
          <ChartCard title="Tickets Anulados por Mes" subtitle="Cantidad de comprobantes anulados" isDark={isDark}><canvas ref={refs.anul.canvas} /></ChartCard>
          <ChartCard title="Ticket Promedio" subtitle="Valor promedio por venta · tendencia mensual" isDark={isDark}><canvas ref={refs.avg.canvas} /></ChartCard>
          <ChartCard title="Total de Clientes Nuevos" subtitle="Nuevos clientes registrados por mes" isDark={isDark}><canvas ref={refs.cli.canvas} /></ChartCard>
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <div className="md:col-span-2">
            <ChartCard title="Top 10 Productos Más Vendidos" subtitle="Por cantidad de unidades vendidas" isDark={isDark}><canvas ref={refs.topProd.canvas} /></ChartCard>
          </div>
          <ChartCard title="Productos vs Servicios" subtitle="Ingreso generado según tipo de item" isDark={isDark}><canvas ref={refs.prodServ.canvas} /></ChartCard>
          
          <div className="md:col-span-3">
             <div className={`flex flex-col rounded-2xl border p-4 gap-2 h-full
                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div>
                  <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Alerta de Stock Muerto</h3>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>Productos con inventario que NO tienen ventas registradas en el rango de fechas seleccionado</p>
                </div>
                <div className="overflow-x-auto mt-2 border rounded-xl dark:border-gray-700 max-h-64 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                        <thead className={`sticky top-0 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            <tr><th className="px-4 py-2">Producto</th><th className="px-4 py-2">Lote ID</th><th className="px-4 py-2">Stock Paralizado</th><th className="px-4 py-2">Costo Total Perdido</th></tr>
                        </thead>
                        <tbody>
                            {stockMuertoList.length > 0 ? stockMuertoList.map((p, i) => (
                                <tr key={i} className={`border-b last:border-0 ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'}`}>
                                    <td className="px-4 py-2 font-semibold">{p.nombre}</td>
                                    <td className="px-4 py-2">{p.loteId || 'Sin Lote'}</td>
                                    <td className="px-4 py-2 text-red-500 font-bold">{p.stock}</td>
                                    <td className="px-4 py-2">{fmt.format((p.stock || 0) * (p.costo || 0))}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="px-4 py-4 text-center text-gray-500">No hay stock muerto detectado. ¡Buen trabajo de rotación!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
          <div className="xl:col-span-2">
            <ChartCard title="Análisis de Margen de Utilidad (Ganancia Real)" subtitle="Ingresos Brutos vs Costos Acumulados = Utilidad Neta Mensual" isDark={isDark}>
               <canvas ref={refs.margen.canvas} />
            </ChartCard>
          </div>
          <ChartCard title="Medios de Cobro" subtitle="Ingresos separados por Medio de Pago" isDark={isDark}><canvas ref={refs.metodos.canvas} /></ChartCard>
          <div className="xl:col-span-3">
             <ChartCard title="Top 5 Mejores Clientes" subtitle="Clientes que generaron más ingresos económicos (VIPs)" isDark={isDark}>
                <canvas ref={refs.topCli.canvas} />
             </ChartCard>
          </div>
        </div>
      )}

    </div>
  );
};

export default Graficos;
