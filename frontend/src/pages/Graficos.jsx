/**
 * ═══════════════════════════════════════════════════════════════
 *  ERSOFT – Panel de Gráficos (/graficos)
 *  Stack: React + Chart.js v4 (canvas API pura)
 *
 *  Grid 3×2:
 *  ┌──────────────────┬──────────────────┐
 *  │ Ventas Mensuales │ Cat. Vendidas    │
 *  ├──────────────────┼──────────────────┤
 *  │ Stock Crítico    │ Tickets Anulados │
 *  ├──────────────────┼──────────────────┤
 *  │ Ticket Promedio  │ Clientes Nuevos  │
 *  └──────────────────┴──────────────────┘
 *
 *  🔌 [API HOOK] = reemplaza con tu fetch() real
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
//  FUNCIONES DE DATOS (🔌 [API HOOK] = conecta tu endpoint)
// ══════════════════════════════════════════════════════════════

// #1 Ventas mensuales – 🔌 GET /api/ventas/mensual
const calcVentasMensuales = (comp) => {
  const totales = new Array(12).fill(0);
  comp.forEach(c => { const d = toDate(c.fecha); if (d) totales[d.getMonth()] += c.total || 0; });
  if (totales.every(v => v === 0))
    return { labels: MESES, data: [3200,4100,3800,5200,4600,6100,5500,7200,6300,8100,7400,9200] };
  return { labels: MESES, data: totales };
};

// #2 Categorías vendidas – 🔌 GET /api/ventas/categorias
const calcCategorias = (comp) => {
  const map = {};
  comp.forEach(c => {
    (c.items || []).forEach(item => {
      const cat = item.categoria || item._type || 'Sin categoría';
      map[cat] = (map[cat] || 0) + (item.qty || 1) * (item.precio || 0);
    });
  });
  const entries = Object.entries(map).sort((a,b) => b[1]-a[1]);
  if (!entries.length) return {
    labels: ['Costura','Tejido','Bordado','Diseño','Otros'],
    data:   [4200, 3100, 2600, 1900, 800],
  };
  return { labels: entries.map(e => e[0]), data: entries.map(e => Math.round(e[1])) };
};

// #3 Tickets anulados por mes – 🔌 GET /api/comprobantes/anulados
const calcAnulados = (comp) => {
  const counts = new Array(12).fill(0);
  comp.filter(c => c.estado === 'Anulado' || c.estado === 'anulado').forEach(c => {
    const d = toDate(c.fecha); if (d) counts[d.getMonth()]++;
  });
  if (counts.every(v => v === 0))
    return { labels: MESES, data: [1,0,2,1,3,0,1,2,0,1,2,1] };
  return { labels: MESES, data: counts };
};

// #4 Ticket promedio por mes – 🔌 GET /api/ventas/ticket-promedio
const calcTicketPromedio = (comp) => {
  const sums = new Array(12).fill(0);
  const cnts = new Array(12).fill(0);
  comp.forEach(c => {
    const d = toDate(c.fecha);
    if (d) { sums[d.getMonth()] += c.total || 0; cnts[d.getMonth()]++; }
  });
  const data = sums.map((s, i) => cnts[i] ? Math.round(s / cnts[i]) : 0);
  if (data.every(v => v === 0))
    return { labels: MESES, data: [480,510,430,560,590,620,550,680,640,710,695,760] };
  return { labels: MESES, data };
};

// #5 Clientes nuevos por mes – 🔌 GET /api/clientes/nuevos
const calcClientesNuevos = () => {
  const clients = load('ersoft_clients');
  const counts = new Array(12).fill(0);
  clients.forEach(c => {
    const d = toDate(c.createdAt || c.fecha);
    if (d) counts[d.getMonth()]++;
  });
  if (counts.every(v => v === 0))
    return { labels: MESES, data: [5,8,6,11,9,14,12,17,13,19,16,22] };
  return { labels: MESES, data: counts };
};

// ─── Filtrar comprobantes según rango de fecha ─────────────────
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

// ─── Presets de rango de fechas ─────────────────────────────────
const PRESETS = [
  { label: '7d',       desde: () => isoMinus(7),  hasta: isoToday },
  { label: '30d',      desde: () => isoMinus(30), hasta: isoToday },
  { label: '3 meses',  desde: () => isoMinus(90), hasta: isoToday },
  { label: 'Este año', desde: isoStartYear,        hasta: isoToday },
  { label: 'Todo',     desde: () => '',            hasta: () => '' },
];

// ════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════
const Graficos = () => {
  const { theme } = useTheme();
  const { productos } = useInventario();
  const isDark = theme === 'dark';

  // ─── Estado del filtro de fechas ───────────────────────────
  const [desde, setDesde] = useState(isoStartYear());
  const [hasta, setHasta] = useState(isoToday());
  const [activePreset, setActivePreset] = useState(3); // "Este año"

  const applyPreset = (idx) => {
    const p = PRESETS[idx];
    setDesde(p.desde()); setHasta(p.hasta());
    setActivePreset(idx);
  };

  // ─── Refs canvas + Chart instances ─────────────────────────
  const refs = {
    bar:    { canvas: useRef(null), chart: useRef(null) },
    pie:    { canvas: useRef(null), chart: useRef(null) },
    donut:  { canvas: useRef(null), chart: useRef(null) },
    anul:   { canvas: useRef(null), chart: useRef(null) },
    avg:    { canvas: useRef(null), chart: useRef(null) },
    cli:    { canvas: useRef(null), chart: useRef(null) },
  };

  const destroy = (ref) => { if (ref.chart.current) { ref.chart.current.destroy(); ref.chart.current = null; } };
  const destroyAll = () => Object.values(refs).forEach(destroy);

  // ─── Datos derivados del filtro ─────────────────────────────
  const allComp = useMemo(() => load('ersoft_comprobantes'), []);
  const comp    = useMemo(() => filterComp(allComp, desde, hasta), [allComp, desde, hasta]);

  const kpis = useMemo(() => {
    const total    = comp.reduce((s, c) => s + (c.total || 0), 0);
    const nVentas  = comp.filter(c => c.estado !== 'Anulado').length;
    const nAnul    = comp.filter(c => c.estado === 'Anulado').length;
    const avg      = nVentas ? Math.round(total / nVentas) : 0;
    const stockC   = productos.filter(p => (p.stock ?? 0) <= 0).length;
    const stockW   = productos.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;
    return { total, nVentas, nAnul, avg, stockC, stockW };
  }, [comp, productos]);

  // ─── Función que rota los colores de los meses con dato máximo
  const barColors = (data, highlight) =>
    data.map((v, i) => v === Math.max(...data) ? highlight : P.blue + 'bb');

  // ─── Inicializar / actualizar todos los gráficos ───────────
  const drawCharts = useCallback(() => {
    destroyAll();
    const opts = baseOpts(isDark);
    const noScales = { ...opts, scales: {} };

    // ── 1. Ventas Mensuales – Bar ──────────────────────────
    const v = calcVentasMensuales(comp);
    refs.bar.chart.current = new Chart(refs.bar.canvas.current, {
      type: 'bar',
      data: {
        labels: v.labels,
        datasets: [{ label: 'Ventas (S/.)', data: v.data,
          backgroundColor: barColors(v.data, P.teal), borderRadius: 7, borderSkipped: false }],
      },
      options: { ...opts,
        plugins: { ...opts.plugins, legend: { display: false },
          tooltip: { ...opts.plugins.tooltip, callbacks: { label: ctx => ` ${fmt.format(ctx.raw)}` } } },
        scales: { x: opts.scales.x, y: { ...opts.scales.y, ticks: { ...opts.scales.y.ticks, callback: fmtS } } },
      },
    });

    // ── 2. Categorías Vendidas – Pie ───────────────────────
    const cat = calcCategorias(comp);
    refs.pie.chart.current = new Chart(refs.pie.canvas.current, {
      type: 'pie',
      data: {
        labels: cat.labels,
        datasets: [{ data: cat.data,
          backgroundColor: PIE_COLORS.slice(0, cat.labels.length),
          borderColor: isDark ? '#1e293b' : '#fff', borderWidth: 2, hoverOffset: 10 }],
      },
      options: { ...noScales,
        plugins: { ...noScales.plugins,
          tooltip: { ...noScales.plugins.tooltip,
            callbacks: { label: ctx => ` ${ctx.label}: ${fmt.format(ctx.raw)}` } } },
      },
    });

    // ── 3. Estado de Stock – Doughnut ──────────────────────
    let ok = 0, warn = 0, crit = 0;
    productos.forEach(p => {
      const s = p.stock ?? 0;
      if (s <= 0) crit++; else if (s <= 5) warn++; else ok++;
    });
    if (!ok && !warn && !crit) { ok = 18; warn = 7; crit = 3; }
    refs.donut.chart.current = new Chart(refs.donut.canvas.current, {
      type: 'doughnut',
      data: {
        labels: ['Stock OK','Reordenar','Sin Stock'],
        datasets: [{ data: [ok, warn, crit], backgroundColor: [P.green, P.amber, P.coralS],
          borderColor: isDark ? '#1e293b' : '#fff', borderWidth: 3, hoverOffset: 8 }],
      },
      options: { ...noScales, cutout: '68%',
        plugins: { ...noScales.plugins,
          tooltip: { ...noScales.plugins.tooltip,
            callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} prod.` } } },
      },
    });

    // ── 4. Tickets Anulados – Bar coral ────────────────────
    const an = calcAnulados(comp);
    refs.anul.chart.current = new Chart(refs.anul.canvas.current, {
      type: 'bar',
      data: {
        labels: an.labels,
        datasets: [{ label: 'Anulados', data: an.data,
          backgroundColor: P.coral + 'cc', borderRadius: 6, borderSkipped: false }],
      },
      options: { ...opts,
        plugins: { ...opts.plugins, legend: { display: false } },
        scales: {
          x: opts.scales.x,
          y: { ...opts.scales.y, ticks: { ...opts.scales.y.ticks, callback: (v) => v, stepSize: 1 }, beginAtZero: true },
        },
      },
    });

    // ── 5. Ticket Promedio – Line ──────────────────────────
    const ap = calcTicketPromedio(comp);
    refs.avg.chart.current = new Chart(refs.avg.canvas.current, {
      type: 'line',
      data: {
        labels: ap.labels,
        datasets: [{ label: 'Ticket Promedio (S/.)', data: ap.data,
          borderColor: P.indigo, backgroundColor: 'rgba(99,102,241,0.12)',
          fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: P.indigo, borderWidth: 2 }],
      },
      options: { ...opts,
        plugins: { ...opts.plugins, legend: { display: false },
          tooltip: { ...opts.plugins.tooltip, callbacks: { label: ctx => ` ${fmt.format(ctx.raw)}` } } },
        scales: { x: opts.scales.x, y: { ...opts.scales.y, ticks: { ...opts.scales.y.ticks, callback: fmtS } } },
      },
    });

    // ── 6. Clientes Nuevos – Bar teal ──────────────────────
    const cl = calcClientesNuevos();
    refs.cli.chart.current = new Chart(refs.cli.canvas.current, {
      type: 'bar',
      data: {
        labels: cl.labels,
        datasets: [{ label: 'Clientes Nuevos', data: cl.data,
          backgroundColor: cl.data.map((v, i) => v === Math.max(...cl.data) ? P.teal : P.teal + '77'),
          borderRadius: 7, borderSkipped: false }],
      },
      options: { ...opts,
        plugins: { ...opts.plugins, legend: { display: false } },
        scales: {
          x: opts.scales.x,
          y: { ...opts.scales.y, ticks: { ...opts.scales.y.ticks, callback: (v) => v, stepSize: 1 }, beginAtZero: true },
        },
      },
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, comp, productos]);

  // Redibujar cuando cambien filtros, tema o inventario
  useEffect(() => {
    drawCharts();
    return () => { destroyAll(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawCharts]);

  // ─── Estilos ─────────────────────────────────────────────
  const pageBg  = isDark ? 'bg-[#313b48]' : 'bg-[#d6d0d4]';
  const inp     = isDark
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-800';
  const btnBase = `px-3 py-1.5 rounded-full text-xs font-semibold border transition-all`;
  const btnAct  = isDark ? 'bg-teal-500 text-white border-teal-500' : 'bg-teal-600 text-white border-teal-600';
  const btnIdle = isDark ? 'border-gray-600 text-gray-300 hover:border-teal-400' : 'border-gray-300 text-gray-600 hover:border-teal-500';

  return (
    <div className={`flex flex-col gap-4 min-h-full -m-6 p-6 ${pageBg}`}>

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Panel de Estadísticas
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
        {/* Presets */}
        {PRESETS.map((p, i) => (
          <button key={p.label} onClick={() => applyPreset(i)}
            className={`${btnBase} ${i === activePreset ? btnAct : btnIdle}`}>
            {p.label}
          </button>
        ))}
        {/* Desde / Hasta manual */}
        <div className="flex items-center gap-1 ml-auto">
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Desde</span>
          <input type="date" value={desde}
            onChange={e => { setDesde(e.target.value); setActivePreset(-1); }}
            className={`text-xs px-2 py-1.5 border rounded-lg outline-none ${inp}`} />
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Hasta</span>
          <input type="date" value={hasta}
            onChange={e => { setHasta(e.target.value); setActivePreset(-1); }}
            className={`text-xs px-2 py-1.5 border rounded-lg outline-none ${inp}`} />
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <KPI label="Total Vendido"   value={fmt.format(kpis.total)}  accent="text-teal-500"  isDark={isDark} />
        <KPI label="Nº Ventas"       value={kpis.nVentas}             accent="text-blue-500"  isDark={isDark} />
        <KPI label="Ticket Promedio" value={fmt.format(kpis.avg)}     accent="text-indigo-400"isDark={isDark} />
        <KPI label="Anulados"        value={kpis.nAnul}               accent="text-red-400"   isDark={isDark} />
        <KPI label="Stock Crítico"   value={`${kpis.stockC} prod.`}   accent="text-red-400"   isDark={isDark} />
        <KPI label="A Reordenar"     value={`${kpis.stockW} prod.`}   accent="text-amber-400" isDark={isDark} />
      </div>

      {/* ── Grid 3×2 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">

        <ChartCard title="Ventas Mensuales"
          subtitle="Ingresos por mes · resaltado = mejor mes"
          isDark={isDark}>
          <canvas ref={refs.bar.canvas} />
        </ChartCard>

        <ChartCard title="Categorías Vendidas"
          subtitle="Distribución de ingresos por categoría"
          isDark={isDark}>
          <canvas ref={refs.pie.canvas} />
        </ChartCard>

        <ChartCard title="Estado Crítico de Stock"
          subtitle="Verde OK · Amarillo Reordenar · Rojo Sin stock"
          isDark={isDark}>
          <canvas ref={refs.donut.canvas} />
        </ChartCard>

        <ChartCard title="Tickets Anulados por Mes"
          subtitle="Cantidad de comprobantes anulados"
          isDark={isDark}>
          <canvas ref={refs.anul.canvas} />
        </ChartCard>

        <ChartCard title="Ticket Promedio"
          subtitle="Valor promedio por venta · tendencia mensual"
          isDark={isDark}>
          <canvas ref={refs.avg.canvas} />
        </ChartCard>

        <ChartCard title="Total de Clientes Nuevos"
          subtitle="Nuevos clientes registrados por mes"
          isDark={isDark}>
          <canvas ref={refs.cli.canvas} />
        </ChartCard>

      </div>

    </div>
  );
};

export default Graficos;
