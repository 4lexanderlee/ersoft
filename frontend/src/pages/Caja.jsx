import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFinanzas } from '../context/FinanzasContext';
import { useDS } from '../hooks/useDS';
import {
  FaLockOpen, FaLock, FaHistory, FaCalendarAlt, FaCashRegister,
  FaTimes, FaCoins, FaFilter, FaSync, FaChevronDown, FaStore, FaUser,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaShieldAlt, FaLaptop, FaNetworkWired, FaUnlock
} from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';
import { logAuditAction } from '../data/simulatedAudit';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const fmtDate = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return {
      date: d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  } catch { return null; }
};

const safeNum = (v) => parseFloat(v) || 0;

/** Convierte YYYY-MM-DD (input[type=date]) → Date a medianoche local */
const parseFilterDate = (s) => {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
};

const toMidnight = (d) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

/* ─── sub-components ──────────────────────────────────────────────────────── */
const DateTimeCell = ({ iso, theme }) => {
  const f = fmtDate(iso);
  if (!f)
    return <span className="italic text-xs text-green-500 font-semibold flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
      En curso
    </span>;
  return (
    <div className="flex flex-col leading-tight">
      <span className={`font-semibold text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{f.date}</span>
      <span className="text-[10px] text-gray-400 font-mono mt-0.5">{f.time}</span>
    </div>
  );
};

const Badge = ({ open }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
    open
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
      : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }`}>
    {open && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
    {open ? 'Abierto' : 'Cerrado'}
  </span>
);

const StatCard = ({ label, value, accent = 'text-yellow-400', sub, isDark }) => (
  <div className={`flex flex-col gap-1 p-4 rounded-2xl border ${
    isDark ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'
  }`}>
    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
    <span className={`text-2xl font-black ${accent}`}>{value}</span>
    {sub && <span className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</span>}
  </div>
);

/* ─── main component ──────────────────────────────────────────────────────── */
const Caja = () => {
  const { theme } = useTheme();
  const ds = useDS();
  const { user } = useAuth();
  const {
    terminalInfo,
    realTerminalInfo,
    simularOtroDispositivo,
    setSimularOtroDispositivo,
    desbloquearTerminalMaster
  } = useFinanzas();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  /* state */
  const [activeSession, setActiveSession] = useState(null);
  const [efectivoVentas, setEfectivoVentas] = useState(0);
  const [historialSesiones, setHistorialSesiones] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [aperturaError, setAperturaError] = useState('');
  const [cierreError, setCierreError] = useState('');
  const [unlockNotice, setUnlockNotice] = useState('');

  /* filters */
  const [filterSucursal, setFilterSucursal] = useState('Todos');
  const [filterUsuario, setFilterUsuario] = useState('Todos');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');

  /* derived */
  const isMasterOrAdmin = user?.role === 'Master' || user?.role === 'Administrador' || user?.rol === 'MASTER';
  const isMaster = user?.role === 'Master' || user?.rol === 'MASTER';

  // Detección de bloqueo de terminal: sesión activa abierta desde otro dispositivo
  const isSessionBlocked = Boolean(
    activeSession &&
    activeSession.terminal_id &&
    activeSession.terminal_id !== terminalInfo.terminal_id
  );

  /* ── load reference data ─────────────────────────────────────── */
  useEffect(() => {
    const DEFAULT_SUCURSALES = [
      { id: '1', nombre: 'Sede Principal' },
      { id: '2', nombre: 'Sede Norte' },
      { id: '3', nombre: 'Sede Sur' },
    ];
    try {
      const s = localStorage.getItem('ersoft_sucursales');
      setSucursales(s ? JSON.parse(s) : DEFAULT_SUCURSALES);
    } catch { setSucursales(DEFAULT_SUCURSALES); }

    try {
      const usrRaw = localStorage.getItem('ersoft_usuarios') || '[]';
      const usrList = JSON.parse(usrRaw);
      // Ensure master user always appears in filter list
      const masterObj = {
        id: 1,
        name: user?.name || 'Alexander Lee Melgarejo',
        role: 'Master',
      };
      // Avoid duplicating if master is already in list
      const withoutMaster = usrList.filter(u => String(u.id) !== '1');
      setUsuarios([masterObj, ...withoutMaster]);
    } catch { setUsuarios([]); }
  }, []);

  /* ── load / refresh caja data ──────────────────────────────────── */
  const loadCajaData = useCallback(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem('ersoft_caja_sesiones') || '[]';
      const sessions = JSON.parse(raw);

      // Sanitize sessions — ensure all required fields exist
      const sanitized = sessions.map(s => ({
        id: s.id || `CAJA-${Math.random()}`,
        estado: s.estado || 'Cerrado',
        fechaApertura: s.fechaApertura || null,
        fechaCierre: s.fechaCierre || null,
        usuarioId: s.usuarioId != null ? String(s.usuarioId) : '?',
        usuarioNombre: s.usuarioNombre || 'Usuario',
        sucursalId: s.sucursalId != null ? String(s.sucursalId) : '1',
        terminal_id: s.terminal_id || null,
        ip_detectada: s.ip_detectada || null,
        navegador_so: s.navegador_so || null,
        desbloqueado_por_master: Boolean(s.desbloqueado_por_master),
        montoApertura: safeNum(s.montoApertura),
        efectivoVentas: safeNum(s.efectivoVentas),
        montoCierre: s.montoCierre != null ? safeNum(s.montoCierre) : null,
        diferencia: s.diferencia != null ? safeNum(s.diferencia) : null,
      }));

      setHistorialSesiones(sanitized);

      /* Find OWN active session – Master has no sucursalId restriction */
      const activeForMe = sanitized.find(s =>
        String(s.usuarioId) === String(user.id) && s.estado === 'Abierto'
      );
      setActiveSession(activeForMe || null);

      /* Calculate cash sales since opening */
      if (activeForMe) {
        const comprobantes = JSON.parse(localStorage.getItem('ersoft_comprobantes') || '[]');
        const cashSales = comprobantes.filter(c => {
          const matchMethod = c.metodoPago === 'cash';
          const matchSeller = c.vendedor === (user.name || user.username || 'Vendedor');
          const matchDate = new Date(c.fecha) >= new Date(activeForMe.fechaApertura);
          const matchState = c.estado !== 'Anulado';
          return matchMethod && matchSeller && matchDate && matchState;
        });
        setEfectivoVentas(cashSales.reduce((sum, c) => sum + safeNum(c.total), 0));
      } else {
        setEfectivoVentas(0);
      }
    } catch (e) {
      console.error('[Caja] loadCajaData error:', e);
    }
  }, [user]);

  useEffect(() => { loadCajaData(); }, [loadCajaData]);

  /* ── actions ─────────────────────────────────────────────────── */
  const handleAbrirCaja = (e) => {
    e.preventDefault();
    const val = parseFloat(montoApertura);
    if (isNaN(val) || val < 0) {
      setAperturaError('Ingrese un monto inicial válido (≥ 0).');
      return;
    }
    try {
      const sessions = JSON.parse(localStorage.getItem('ersoft_caja_sesiones') || '[]');
      const newSession = {
        id: `CAJA-${Date.now()}`,
        estado: 'Abierto',
        fechaApertura: new Date().toISOString(),
        fechaCierre: null,
        usuarioId: String(user.id),
        usuarioNombre: user.name || user.username || 'Usuario',
        sucursalId: String(user.sucursalId || '1'),
        terminal_id: terminalInfo.terminal_id,
        ip_detectada: terminalInfo.ip_detectada,
        navegador_so: terminalInfo.navegador_so,
        montoApertura: val,
        efectivoVentas: 0,
        montoCierre: null,
        diferencia: null,
      };
      localStorage.setItem('ersoft_caja_sesiones', JSON.stringify([newSession, ...sessions]));

      logAuditAction({
        usuario: user.name || user.username || 'Usuario',
        sucursalId: user.sucursalId || '1',
        modulo: 'CAJA',
        tipoAccion: 'CREAR',
        descripcion: `Apertura de turno de Caja (${newSession.id}) con monto inicial S/ ${val.toFixed(2)} vinculada a terminal ${terminalInfo.terminal_id} (${terminalInfo.ip_detectada})`,
        datosNuevos: newSession,
        ip: terminalInfo.ip_detectada
      });

      setMontoApertura('');
      setAperturaError('');
      loadCajaData();
    } catch (err) {
      console.error(err);
      setAperturaError('Error al guardar la sesión.');
    }
  };

  const handleCerrarCaja = (e) => {
    e.preventDefault();
    if (isSessionBlocked) {
      setCierreError(`Terminal Bloqueada: Esta caja pertenece al terminal físico ${activeSession.terminal_id} (IP ${activeSession.ip_detectada}). Está prohibido cerrar el turno desde este dispositivo.`);
      return;
    }
    const val = parseFloat(montoCierre);
    if (isNaN(val) || val < 0) { setCierreError('Ingrese un monto de cierre válido.'); return; }
    if (!activeSession) return;
    try {
      const sessions = JSON.parse(localStorage.getItem('ersoft_caja_sesiones') || '[]');
      const esperado = safeNum(activeSession.montoApertura) + efectivoVentas;
      const updated = sessions.map(s =>
        s.id === activeSession.id
          ? {
              ...s,
              estado: 'Cerrado',
              fechaCierre: new Date().toISOString(),
              efectivoVentas,
              montoCierre: val,
              diferencia: val - esperado,
              terminal_cierre_id: terminalInfo.terminal_id,
              ip_cierre: terminalInfo.ip_detectada
            }
          : s
      );
      localStorage.setItem('ersoft_caja_sesiones', JSON.stringify(updated));

      logAuditAction({
        usuario: user.name || user.username || 'Usuario',
        sucursalId: user.sucursalId || '1',
        modulo: 'CAJA',
        tipoAccion: 'EDITAR',
        descripcion: `Cierre y arqueo de Caja (${activeSession.id}) con monto físico S/ ${val.toFixed(2)} (esperado: S/ ${esperado.toFixed(2)}) desde terminal ${terminalInfo.terminal_id}`,
        datosPrevios: { estado: 'Abierto', montoApertura: activeSession.montoApertura },
        datosNuevos: { estado: 'Cerrado', montoCierre: val, diferencia: val - esperado },
        ip: terminalInfo.ip_detectada
      });

      setMontoCierre('');
      setCierreError('');
      loadCajaData();
    } catch (err) {
      console.error(err);
      setCierreError('Error al cerrar la caja.');
    }
  };

  const handleMasterForceUnlock = () => {
    if (!activeSession) return;
    try {
      desbloquearTerminalMaster(activeSession.id, user);
      setUnlockNotice(`Terminal desbloqueada por MASTER. Se autorizó la sesión para ${terminalInfo.terminal_id} (${terminalInfo.ip_detectada}) y se auditó el evento.`);
      setCierreError('');
      loadCajaData();
    } catch (err) {
      console.error(err);
      setCierreError('Error al ejecutar desbloqueo forzado de terminal.');
    }
  };

  /* ── filter logic ─────────────────────────────────────────────── */
  const filteredHistory = historialSesiones.filter(s => {
    // Non-admin: only own history
    if (!isMasterOrAdmin && String(s.usuarioId) !== String(user?.id)) return false;

    // Admin filters
    if (filterSucursal !== 'Todos' && String(s.sucursalId) !== String(filterSucursal)) return false;
    if (filterUsuario !== 'Todos' && String(s.usuarioId) !== String(filterUsuario)) return false;
    if (filterEstado !== 'Todos' && s.estado !== filterEstado) return false;

    // Date range
    if ((filterFechaDesde || filterFechaHasta) && s.fechaApertura) {
      const sd = toMidnight(new Date(s.fechaApertura));
      const desde = filterFechaDesde ? parseFilterDate(filterFechaDesde) : null;
      const hasta = filterFechaHasta ? parseFilterDate(filterFechaHasta) : null;
      if (desde && sd < desde) return false;
      if (hasta && sd > hasta) return false;
    }
    return true;
  });

  const handleReset = () => {
    setFilterSucursal('Todos');
    setFilterUsuario('Todos');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setFilterEstado('Todos');
  };

  const getBranchName = (id) => {
    const s = sucursales.find(x => String(x.id) === String(id));
    return s ? (s.nombre || s.nombreComercial || `Sede ${id}`) : `Sede ${id}`;
  };

  /* ── KPI totals ───────────────────────────────────────────────── */
  const totalAbiertos = historialSesiones.filter(s => s.estado === 'Abierto').length;
  const totalCerrados = historialSesiones.filter(s => s.estado === 'Cerrado').length;
  const sobrantes = historialSesiones.filter(s => s.diferencia != null && s.diferencia > 0).length;
  const faltantes = historialSesiones.filter(s => s.diferencia != null && s.diferencia < 0).length;

  /* ── styles ───────────────────────────────────────────────────── */
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subTx = isDark ? 'text-gray-400' : 'text-gray-500';
  const selectCls = `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 
    ${isDark ? 'bg-gray-700/60 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`;

  /* ══ JSX ══════════════════════════════════════════════════════════════════ */
  return (
    <div className={`flex flex-col min-h-full -m-6 ${ds.pageBg}`}>
      <PageHeader
        onBack={() => navigate('/principal')}
        backLabel="Volver al menú"
        right={
          <button
            onClick={loadCajaData}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors
              ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            title="Actualizar datos"
          >
            <FaSync size={13} /> Actualizar
          </button>
        }
      />

      <div className="flex flex-col gap-6 px-6 md:px-10 py-6 max-w-7xl mx-auto w-full pb-12">

        {/* ── PANEL DE SEGURIDAD DE TERMINAL (RN-07) ──────────────── */}
        <div className={`rounded-2xl border p-5 ${ds.cardBg} flex flex-col gap-4 shadow-sm`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isSessionBlocked ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <FaShieldAlt size={18} />
              </div>
              <div>
                <h3 className={`font-black text-sm uppercase tracking-wide ${text}`}>
                  Seguridad de Terminal y Detección de Dispositivo / IP (RN-07)
                </h3>
                <p className={`text-xs ${subTx}`}>
                  Huella digital de hardware, IP detectada y control de acceso exclusivo a caja
                </p>
              </div>
            </div>

            {/* Simulation Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setUnlockNotice('');
                  setSimularOtroDispositivo(!simularOtroDispositivo);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                  simularOtroDispositivo
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                    : isDark
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${simularOtroDispositivo ? 'bg-black animate-ping' : 'bg-gray-400'}`} />
                Simular acceso desde otro dispositivo/IP
              </button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xl border flex flex-col gap-1 ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${subTx}`}>
                <FaLaptop size={11} /> ID Terminal Activo
              </span>
              <span className={`font-mono text-sm font-black ${simularOtroDispositivo ? 'text-amber-400' : text}`}>
                {terminalInfo.terminal_id}
              </span>
              <span className="text-[10px] text-gray-400">{terminalInfo.navegador_so}</span>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col gap-1 ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${subTx}`}>
                <FaNetworkWired size={11} /> IP Detectada
              </span>
              <span className={`font-mono text-sm font-black ${simularOtroDispositivo ? 'text-amber-400' : 'text-emerald-400'}`}>
                {terminalInfo.ip_detectada}
              </span>
              <span className="text-[10px] text-gray-400">
                {simularOtroDispositivo ? 'IP Remota Simulada' : 'Red Local / Ethernet'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col gap-1 ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${subTx}`}>
                Terminal en Caja Abierta
              </span>
              <span className={`font-mono text-sm font-black ${text}`}>
                {activeSession ? (activeSession.terminal_id || 'Sin vincular') : 'Ninguna caja abierta'}
              </span>
              <span className="text-[10px] text-gray-400">
                {activeSession ? (activeSession.ip_detectada || 'IP local') : 'Esperando apertura'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              !activeSession
                ? isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'
                : isSessionBlocked
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                !activeSession ? subTx : isSessionBlocked ? 'text-red-400' : 'text-emerald-400'
              }`}>
                Estado de Terminal
              </span>
              <span className={`text-xs font-black uppercase ${
                !activeSession ? subTx : isSessionBlocked ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {!activeSession ? 'Sin turno activo' : isSessionBlocked ? 'Terminal Bloqueada' : 'Terminal Autorizada'}
              </span>
              <span className="text-[10px] text-gray-400">
                {!activeSession
                  ? 'Se vinculará a este terminal al abrir'
                  : isSessionBlocked
                  ? 'Operación/cierre denegado'
                  : 'Acceso exclusivo concedido'}
              </span>
            </div>
          </div>

          {/* Banner si la terminal está bloqueada */}
          {isSessionBlocked && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-bold text-xs text-red-400 uppercase tracking-wide">
                    Acceso Bloqueado: Dispositivo no Autorizado (RN-07)
                  </p>
                  <p className={`text-xs mt-0.5 ${text}`}>
                    Esta caja fue aperturada desde la terminal <strong>{activeSession.terminal_id}</strong> (IP: {activeSession.ip_detectada}).
                    Por integridad y seguridad, está estrictamente bloqueado operar o cerrar la caja desde un dispositivo diferente.
                  </p>
                </div>
              </div>

              {/* Botón de desbloqueo forzado exclusivo para MASTER */}
              {isMaster && (
                <button
                  type="button"
                  onClick={handleMasterForceUnlock}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
                >
                  <FaUnlock size={11} /> Desbloqueo Forzado (Master)
                </button>
              )}
            </div>
          )}

          {unlockNotice && (
            <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
              ✓ {unlockNotice}
            </p>
          )}
        </div>

        {/* ── TOP ROW: Status + Form ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

          {/* Status Card */}
          <div className={`lg:col-span-2 rounded-2xl border p-5 flex flex-col gap-4 ${ds.cardBg} relative overflow-hidden`}>
            <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none
              ${activeSession ? 'bg-green-400' : 'bg-red-400'}`} />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeSession ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                  <FaCashRegister size={20} />
                </div>
                <div>
                  <h2 className={`font-black text-base tracking-tight ${text}`}>Estado de tu Caja</h2>
                  <p className={`text-xs mt-0.5 ${subTx}`}>
                    {user?.name || 'Usuario'} · {getBranchName(user?.sucursalId || '1')}
                  </p>
                </div>
              </div>
              <Badge open={!!activeSession} />
            </div>

            {activeSession ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                <StatCard
                  label="Monto Apertura"
                  value={`S/. ${safeNum(activeSession.montoApertura).toFixed(2)}`}
                  accent="text-yellow-400"
                  sub={fmtDate(activeSession.fechaApertura)?.date || '—'}
                  isDark={isDark}
                />
                <StatCard
                  label="Ventas Efectivo"
                  value={`S/. ${efectivoVentas.toFixed(2)}`}
                  accent="text-emerald-400"
                  sub="Solo transacciones cash"
                  isDark={isDark}
                />
                <StatCard
                  label="Saldo Esperado"
                  value={`S/. ${(safeNum(activeSession.montoApertura) + efectivoVentas).toFixed(2)}`}
                  accent={isDark ? 'text-white' : 'text-gray-900'}
                  sub="Efectivo total en caja"
                  isDark={isDark}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <span className="text-5xl opacity-25">🏦</span>
                <p className={`font-bold text-sm ${text}`}>Ningún turno activo</p>
                <p className={`text-xs max-w-xs ${subTx}`}>
                  Apertura tu turno ingresando el efectivo inicial de caja para comenzar a registrar ventas.
                </p>
              </div>
            )}
          </div>

          {/* Action Form */}
          <div className={`rounded-2xl border p-5 ${ds.cardBg}`}>
            {!activeSession ? (
              <form onSubmit={handleAbrirCaja} className="flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <FaLockOpen className="text-yellow-400" size={14} />
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${text}`}>Aperturar Turno</h3>
                </div>
                {aperturaError && (
                  <p className="text-red-400 text-xs py-2 px-3 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                    {aperturaError}
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${subTx}`}>
                    Monto Inicial (Efectivo)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">S/.</span>
                    <input
                      type="number" step="0.01" min="0"
                      value={montoApertura}
                      onChange={e => setMontoApertura(e.target.value)}
                      placeholder="0.00"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm tracking-wide transition-all mt-1 active:scale-95"
                >
                  ABRIR CAJA
                </button>
              </form>
            ) : (
              <form onSubmit={handleCerrarCaja} className="flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <FaLock className="text-yellow-400" size={14} />
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${text}`}>Cierre y Arqueo</h3>
                </div>
                {cierreError && (
                  <p className="text-red-400 text-xs py-2 px-3 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                    {cierreError}
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${subTx}`}>
                    Monto Físico en Caja
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">S/.</span>
                    <input
                      type="number" step="0.01" min="0"
                      value={montoCierre}
                      onChange={e => setMontoCierre(e.target.value)}
                      placeholder="Conteo físico real"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
                    />
                  </div>
                </div>

                {montoCierre !== '' && (() => {
                  const fis = parseFloat(montoCierre) || 0;
                  const esp = safeNum(activeSession.montoApertura) + efectivoVentas;
                  const dif = fis - esp;
                  return (
                    <div className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between"><span className={subTx}>Esperado:</span><span className={`font-bold ${text}`}>S/. {esp.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className={subTx}>Físico:</span><span className={`font-bold ${text}`}>S/. {fis.toFixed(2)}</span></div>
                      <div className={`border-t pt-1.5 mt-0.5 flex justify-between font-black text-sm ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                        <span className={text}>Diferencia:</span>
                        {dif > 0 ? <span className="text-emerald-400">+S/. {dif.toFixed(2)}</span>
                          : dif < 0 ? <span className="text-red-400">-S/. {Math.abs(dif).toFixed(2)}</span>
                          : <span className="text-gray-400">Cuadrada</span>}
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="submit"
                  disabled={isSessionBlocked}
                  className={`w-full py-3 rounded-xl font-black text-sm tracking-wide transition-all mt-1 ${
                    isSessionBlocked
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-60'
                      : 'bg-red-600 hover:bg-red-500 text-white active:scale-95 cursor-pointer'
                  }`}
                >
                  {isSessionBlocked ? 'BLOQUEADO: TERMINAL NO AUTORIZADA' : 'CERRAR TURNO Y CAJA'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── KPI SUMMARY (Master/Admin only) ───────────────────── */}
        {isMasterOrAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Cajas Abiertas', value: totalAbiertos, color: 'text-emerald-400', icon: <FaCheckCircle size={18} className="text-emerald-400 opacity-60" /> },
              { label: 'Cajas Cerradas', value: totalCerrados, color: 'text-gray-400',    icon: <FaTimesCircle size={18} className="text-gray-400 opacity-60" /> },
              { label: 'Con Sobrante',   value: sobrantes,     color: 'text-blue-400',    icon: <FaCoins size={18} className="text-blue-400 opacity-60" /> },
              { label: 'Con Faltante',   value: faltantes,     color: 'text-red-400',     icon: <FaExclamationTriangle size={18} className="text-red-400 opacity-60" /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className={`flex items-center gap-3 p-4 rounded-2xl border ${ds.cardBg}`}>
                {icon}
                <div>
                  <p className={`text-xs font-medium ${subTx}`}>{label}</p>
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── AUDIT FILTERS ──────────────────────────────────────── */}
        <div className={`rounded-2xl border ${ds.cardBg}`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
                <FaFilter className="text-yellow-500" size={13} />
              </div>
              <div>
                <h3 className={`font-black text-sm uppercase tracking-wide ${text}`}>
                  {isMasterOrAdmin ? 'Auditoría y Filtros' : 'Mis Turnos'}
                </h3>
                <p className={`text-[10px] mt-0.5 ${subTx}`}>
                  {isMasterOrAdmin ? 'Filtra por sede, cajero, fecha y estado' : 'Historial de tus turnos de caja'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isDark ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                {filteredHistory.length} registros
              </span>
              <button
                onClick={handleReset}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                  ${isDark ? 'border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700' : 'border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                title="Limpiar filtros"
              >
                <FaTimes size={10} /> Limpiar
              </button>
            </div>
          </div>

          {/* Filter controls */}
          {isMasterOrAdmin && (
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              {/* Sucursal */}
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${subTx}`}>
                  <FaStore size={9} /> Sucursal
                </label>
                <select value={filterSucursal} onChange={e => setFilterSucursal(e.target.value)} className={selectCls}>
                  <option value="Todos">Todas las sedes</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre || s.nombreComercial}</option>
                  ))}
                </select>
              </div>

              {/* Usuario */}
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${subTx}`}>
                  <FaUser size={9} /> Cajero / Usuario
                </label>
                <select value={filterUsuario} onChange={e => setFilterUsuario(e.target.value)} className={selectCls}>
                  <option value="Todos">Todos los cajeros</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${subTx}`}>
                  Estado
                </label>
                <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className={selectCls}>
                  <option value="Todos">Todos</option>
                  <option value="Abierto">Abierto</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>

              {/* Fecha Desde */}
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${subTx}`}>
                  <FaCalendarAlt size={9} /> Desde
                </label>
                <input
                  type="date"
                  value={filterFechaDesde}
                  onChange={e => setFilterFechaDesde(e.target.value)}
                  className={selectCls}
                />
              </div>

              {/* Fecha Hasta */}
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${subTx}`}>
                  <FaCalendarAlt size={9} /> Hasta
                </label>
                <input
                  type="date"
                  value={filterFechaHasta}
                  onChange={e => setFilterFechaHasta(e.target.value)}
                  className={selectCls}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── HISTORY TABLE ─────────────────────────────────────── */}
        <div className={`rounded-2xl border overflow-hidden ${ds.cardBg}`}>
          <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/60'}`}>
            <h3 className={`font-black text-sm uppercase tracking-wide ${text}`}>
              Historial de Turnos de Caja
            </h3>
            <p className={`text-xs mt-0.5 ${subTx}`}>
              {isMasterOrAdmin
                ? 'Registro completo de aperturas y cierres de caja de toda la empresa'
                : 'Registro de tus turnos de caja'}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 850 }}>
              <thead>
                <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${subTx} ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <th className="px-5 py-3.5 w-32">ID Sesión</th>
                  <th className="px-5 py-3.5">Sucursal</th>
                  <th className="px-5 py-3.5">Terminal / IP</th>
                  <th className="px-5 py-3.5">Cajero</th>
                  <th className="px-5 py-3.5">Apertura</th>
                  <th className="px-5 py-3.5">Cierre</th>
                  <th className="px-5 py-3.5 text-right">Monto Ini.</th>
                  <th className="px-5 py-3.5 text-right">Ventas Cash</th>
                  <th className="px-5 py-3.5 text-right">Cierre Físico</th>
                  <th className="px-5 py-3.5 text-right">Diferencia</th>
                  <th className="px-5 py-3.5 text-center w-28">Estado</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700/60' : 'divide-gray-100'}`}>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <FaCoins size={28} className="opacity-20" />
                        <p className={`text-sm ${subTx} italic`}>
                          No hay registros de caja con los filtros aplicados.
                        </p>
                        {(filterSucursal !== 'Todos' || filterUsuario !== 'Todos' || filterFechaDesde || filterFechaHasta || filterEstado !== 'Todos') && (
                          <button
                            onClick={handleReset}
                            className="text-xs font-semibold text-yellow-500 hover:underline"
                          >
                            Limpiar todos los filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((s) => {
                    const dif = s.diferencia != null ? safeNum(s.diferencia) : null;
                    const isClosed = s.estado === 'Cerrado';
                    const shortId = String(s.id).replace('CAJA-', '#');

                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors ${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-yellow-50/40'}`}
                      >
                        {/* ID */}
                        <td className="px-5 py-4">
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                            isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`} title={s.id}>
                            {shortId.length > 12 ? shortId.slice(0, 12) + '…' : shortId}
                          </span>
                        </td>

                        {/* Sucursal */}
                        <td className="px-5 py-4">
                          <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {getBranchName(s.sucursalId)}
                          </span>
                        </td>

                        {/* Terminal / IP */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col leading-tight">
                            <span className={`font-mono text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {s.terminal_id || 'TERM-LOCAL'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {s.ip_detectada || '192.168.1.100'}
                            </span>
                          </div>
                        </td>

                        {/* Cajero */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {(s.usuarioNombre || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {s.usuarioNombre || 'Usuario'}
                            </span>
                          </div>
                        </td>

                        {/* Apertura */}
                        <td className="px-5 py-4">
                          <DateTimeCell iso={s.fechaApertura} theme={theme} />
                        </td>

                        {/* Cierre */}
                        <td className="px-5 py-4">
                          {isClosed
                            ? <DateTimeCell iso={s.fechaCierre} theme={theme} />
                            : <span className={`text-xs italic ${subTx}`}>—</span>
                          }
                        </td>

                        {/* Apertura monto */}
                        <td className="px-5 py-4 text-right">
                          <span className={`text-sm font-bold ${subTx}`}>
                            S/. {safeNum(s.montoApertura).toFixed(2)}
                          </span>
                        </td>

                        {/* Ventas cash */}
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-bold text-emerald-500">
                            S/. {safeNum(s.efectivoVentas).toFixed(2)}
                          </span>
                        </td>

                        {/* Cierre físico */}
                        <td className="px-5 py-4 text-right">
                          {s.montoCierre != null
                            ? <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>S/. {safeNum(s.montoCierre).toFixed(2)}</span>
                            : <span className={`text-xs italic ${subTx}`}>En curso</span>
                          }
                        </td>

                        {/* Diferencia */}
                        <td className="px-5 py-4 text-right">
                          {!isClosed
                            ? <span className={`text-xs italic ${subTx}`}>—</span>
                            : dif == null
                            ? <span className={`text-xs italic ${subTx}`}>—</span>
                            : dif > 0
                            ? <span className="text-sm font-black text-emerald-400">+S/. {dif.toFixed(2)}</span>
                            : dif < 0
                            ? <span className="text-sm font-black text-red-400">-S/. {Math.abs(dif).toFixed(2)}</span>
                            : <span className={`text-sm font-bold ${subTx}`}>S/. 0.00</span>
                          }
                        </td>

                        {/* Estado */}
                        <td className="px-5 py-4 text-center">
                          <Badge open={!isClosed} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Caja;
