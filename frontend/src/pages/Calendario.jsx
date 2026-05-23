/**
 * ══════════════════════════════════════════════════════
 *  ERSOFT – Módulo de Calendario (/calendario)
 *  Vistas: Semana · Mes · Agenda
 *  Calendarios: Global (Master/Admin) | Sucursal
 * ══════════════════════════════════════════════════════
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDS } from '../hooks/useDS';
import { useAuth } from '../context/AuthContext';
import {
  FaPlus, FaTimes, FaChevronLeft, FaChevronRight, FaCalendarAlt,
  FaGlobe, FaStore, FaCheck, FaTrash, FaPencilAlt, FaSync,
  FaCircle, FaClock, FaTag, FaAlignLeft, FaBullseye,
} from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';

/* ─── constants ────────────────────────────────────────────────────── */
const DAYS_ES  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const EVENT_COLORS = [
  { id: 'indigo',  label: 'Índigo',   bg: 'bg-indigo-500',   border: 'border-indigo-400',   text: 'text-white',   hex: '#6366f1' },
  { id: 'emerald', label: 'Verde',    bg: 'bg-emerald-500',  border: 'border-emerald-400',  text: 'text-white',   hex: '#10b981' },
  { id: 'amber',   label: 'Ámbar',    bg: 'bg-amber-500',    border: 'border-amber-400',    text: 'text-black',   hex: '#f59e0b' },
  { id: 'rose',    label: 'Rosa',     bg: 'bg-rose-500',     border: 'border-rose-400',     text: 'text-white',   hex: '#f43f5e' },
  { id: 'sky',     label: 'Celeste',  bg: 'bg-sky-500',      border: 'border-sky-400',      text: 'text-white',   hex: '#0ea5e9' },
  { id: 'violet',  label: 'Violeta',  bg: 'bg-violet-500',   border: 'border-violet-400',   text: 'text-white',   hex: '#8b5cf6' },
  { id: 'orange',  label: 'Naranja',  bg: 'bg-orange-500',   border: 'border-orange-400',   text: 'text-white',   hex: '#f97316' },
  { id: 'teal',    label: 'Teal',     bg: 'bg-teal-500',     border: 'border-teal-400',     text: 'text-white',   hex: '#14b8a6' },
];

const colorOf = (id) => EVENT_COLORS.find(c => c.id === id) || EVENT_COLORS[0];

/* ─── helpers ───────────────────────────────────────────────────────── */
const today = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d;
};
const isoDay = (d) => d.toISOString().slice(0,10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0,0,0,0); return x; };
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const parseTime = (t) => { // "08:30" → minutes since midnight
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};
const fmtTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h < 12 ? 'am' : 'pm';
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2,'0')}${ampm}`;
};
const dayLabel = (d) => `${DAYS_ES[d.getDay()]} ${d.getDate()}`;

/* ─── permission check ──────────────────────────────────────────────── */
const getCalPerm = (user, calType) => {
  // Master always has full access
  if (!user || user.role === 'Master') return { ver: true, crear: true, editar: true, eliminar: true };
  try {
    const saved = localStorage.getItem('ersoft_roles_permisos');
    const roles = saved ? JSON.parse(saved) : {};
    const rp = roles[user.role];
    if (!rp) return { ver: false, crear: false, editar: false, eliminar: false };
    const key = calType === 'global' ? 'calendario_global' : 'calendario_sucursal';
    return rp[key] || { ver: true, crear: false, editar: false, eliminar: false };
  } catch { return { ver: true, crear: false, editar: false, eliminar: false }; }
};

/* ─── storage ───────────────────────────────────────────────────────── */
const STORAGE_KEY = 'ersoft_calendario_eventos';
const loadEvents = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};
const saveEvents = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

/* ─── EventModal ─────────────────────────────────────────────────────── */
const EventModal = ({ initial, calType, sucursales, user, ds, onSave, onDelete, onClose }) => {
  const isDark = ds.isDark;
  const isEditing = !!initial?.id;
  const [form, setForm] = useState({
    title: initial?.title || '',
    type: initial?.type || 'evento',           // 'evento' | 'tarea'
    color: initial?.color || 'indigo',
    date: initial?.date || isoDay(today()),
    startTime: initial?.startTime || '09:00',
    endTime: initial?.endTime || '10:00',
    allDay: initial?.allDay || false,
    desc: initial?.desc || '',
    taskDone: initial?.taskDone || false,
  });
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) { setErr('El título es obligatorio.'); return; }
    if (!form.date) { setErr('La fecha es obligatoria.'); return; }
    onSave({
      ...form,
      id: initial?.id || `ev-${Date.now()}`,
      calType,
      sucursalId: calType === 'sucursal' ? (user?.sucursalId || '1') : null,
      createdBy: user?.id,
      createdByName: user?.name || 'Usuario',
    });
  };

  const inp = `w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`;
  const label = `text-[10px] font-bold uppercase tracking-wider block mb-1 ${ds.muted}`;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-y-auto ${ds.cardBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`font-black text-base ${ds.text}`}>
            {isEditing ? 'Editar' : 'Nuevo'} {form.type === 'tarea' ? 'Tarea' : 'Evento'}
          </h3>
          <button onClick={onClose} className={`${ds.muted} hover:${ds.text}`}><FaTimes size={16} /></button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {err && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-center">{err}</p>}

          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
            {['evento','tarea'].map(t => (
              <button
                key={t}
                onClick={() => set('type', t)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  form.type === t
                    ? 'bg-yellow-500 text-black'
                    : isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {t === 'evento' ? '📅 Evento' : '✅ Tarea'}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className={label}>Título *</label>
            <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej. Reunión de equipo" />
          </div>

          {/* Date */}
          <div>
            <label className={label}>Fecha *</label>
            <input type="date" className={inp} value={form.date} onChange={e => set('date', e.target.value)} />
          </div>

          {/* Time (only for events) */}
          {form.type === 'evento' && !form.allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Inicio</label>
                <input type="time" className={inp} value={form.startTime} onChange={e => set('startTime', e.target.value)} />
              </div>
              <div>
                <label className={label}>Fin</label>
                <input type="time" className={inp} value={form.endTime} onChange={e => set('endTime', e.target.value)} />
              </div>
            </div>
          )}

          {/* All day toggle (events only) */}
          {form.type === 'evento' && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => set('allDay', !form.allDay)}
                className={`w-9 h-5 rounded-full relative transition-colors ${form.allDay ? 'bg-yellow-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.allDay ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className={`text-xs font-semibold ${ds.muted}`}>Todo el día</span>
            </label>
          )}

          {/* Task done toggle */}
          {form.type === 'tarea' && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => set('taskDone', !form.taskDone)}
                className={`w-9 h-5 rounded-full relative transition-colors ${form.taskDone ? 'bg-emerald-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.taskDone ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className={`text-xs font-semibold ${ds.muted}`}>Marcar como completada</span>
            </label>
          )}

          {/* Color picker */}
          <div>
            <label className={label}>Color</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => set('color', c.id)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${c.bg} ${form.color === c.id ? 'border-white scale-110' : 'border-transparent'}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={label}>Descripción</label>
            <textarea
              rows={2}
              className={`${inp} resize-none`}
              value={form.desc}
              onChange={e => set('desc', e.target.value)}
              placeholder="Detalle opcional..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-3 px-5 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {isEditing && onDelete && (
            <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors">
              <FaTrash size={11} /> Eliminar
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
            Cancelar
          </button>
          <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm transition-colors flex items-center gap-1.5">
            <FaCheck size={11} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
const Calendario = () => {
  const ds = useDS();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDark = ds.isDark;

  /* calendar state */
  const [view, setView] = useState('semana');       // 'semana' | 'mes' | 'agenda'
  const [calType, setCalType] = useState('global'); // 'global' | 'sucursal'
  const [cursor, setCursor] = useState(today());    // anchor date for navigation
  const [events, setEvents] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  /* modal */
  const [modal, setModal] = useState(null); // null | { mode:'new'|'edit', initial?, date? }

  /* current time line */
  const [nowMin, setNowMin] = useState(() => {
    const d = new Date(); return d.getHours() * 60 + d.getMinutes();
  });
  const scrollRef = useRef(null);

  const perm = getCalPerm(user, calType);

  /* ── load ─────────────────────────────────────────── */
  const loadData = useCallback(() => {
    setEvents(loadEvents());
    try {
      const s = localStorage.getItem('ersoft_sucursales');
      setSucursales(s ? JSON.parse(s) : [
        { id: '1', nombre: 'Sede Principal' },
        { id: '2', nombre: 'Sede Norte' },
        { id: '3', nombre: 'Sede Sur' },
      ]);
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* live clock */
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  /* scroll to 8am on mount */
  useEffect(() => {
    if (scrollRef.current && view === 'semana') {
      scrollRef.current.scrollTop = 8 * 60 - 20;
    }
  }, [view]);

  /* ── filter events by calType / sucursal ─────────── */
  const visibleEvents = events.filter(ev => {
    if (ev.calType !== calType) return false;
    if (calType === 'sucursal') {
      const userSuc = String(user?.sucursalId || '1');
      if (user?.role !== 'Master' && String(ev.sucursalId) !== userSuc) return false;
    }
    return true;
  });

  /* ── save / delete ────────────────────────────────── */
  const handleSave = (data) => {
    const all = loadEvents();
    const idx = all.findIndex(e => e.id === data.id);
    if (idx >= 0) all[idx] = data;
    else all.push(data);
    saveEvents(all);
    setEvents(all);
    setModal(null);
  };

  const handleDelete = (id) => {
    const all = loadEvents().filter(e => e.id !== id);
    saveEvents(all);
    setEvents(all);
    setModal(null);
  };

  /* ── navigation ────────────────────────────────────── */
  const goToday = () => setCursor(today());
  const goPrev = () => {
    if (view === 'semana') setCursor(p => addDays(p, -7));
    else setCursor(p => addDays(startOfMonth(p), -1));
  };
  const goNext = () => {
    if (view === 'semana') setCursor(p => addDays(p, 7));
    else setCursor(p => addDays(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1), 0));
  };

  /* ── week range ────────────────────────────────────── */
  const weekStart = startOfWeek(cursor);
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  /* ── month grid ────────────────────────────────────── */
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const firstDow   = monthStart.getDay(); // 0=Sun
  const totalDays  = daysInMonth(cursor.getFullYear(), cursor.getMonth());

  /* get events for a specific ISO date */
  const eventsOnDay = (iso) => visibleEvents.filter(ev => ev.date === iso);
  const tasksOnDay  = (iso) => visibleEvents.filter(ev => ev.date === iso && ev.type === 'tarea');
  const nonTasksOnDay = (iso) => visibleEvents.filter(ev => ev.date === iso && ev.type === 'evento');

  /* ── open modal ─────────────────────────────────────── */
  const openNew = (date = isoDay(today())) => {
    if (!perm.crear) return;
    setModal({ mode: 'new', initial: { date } });
  };
  const openEdit = (ev) => {
    if (!perm.editar) {
      setModal({ mode: 'view', initial: ev });
      return;
    }
    setModal({ mode: 'edit', initial: ev });
  };

  /* ─── styles ─────────────────────────────────────── */
  const text   = isDark ? 'text-white' : 'text-gray-900';
  const subTx  = isDark ? 'text-gray-400' : 'text-gray-500';
  const gridBd = isDark ? 'border-gray-700' : 'border-gray-200';
  const hdr    = isDark ? 'bg-gray-800/50' : 'bg-gray-50';

  const tabBtn = (active) => `px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
    active
      ? 'bg-yellow-500 text-black'
      : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
  }`;

  const calTabBtn = (active) => `flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${
    active
      ? 'bg-yellow-500 text-black border-yellow-400'
      : isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-300 text-gray-500 hover:bg-gray-100'
  }`;

  /* sucursal name */
  const getSucursalName = (id) => {
    const s = sucursales.find(x => String(x.id) === String(id));
    return s ? (s.nombre || s.nombreComercial) : `Sede ${id}`;
  };

  /* ══════════════════════════════════════════════════════
     WEEK VIEW
  ══════════════════════════════════════════════════════ */
  const WeekView = () => {
    const todayStr = isoDay(today());
    const CELL_H = 60; // px per hour
    const TOTAL_H = 24 * CELL_H;

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Day headers */}
        <div className={`grid border-b ${gridBd} ${hdr}`} style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          <div className={`border-r ${gridBd} py-2.5 text-center`}>
            <span className={`text-[9px] font-bold uppercase ${subTx}`}>GMT-5</span>
          </div>
          {weekDays.map(d => {
            const iso = isoDay(d);
            const isToday = iso === todayStr;
            const dayEvs = eventsOnDay(iso);
            return (
              <div key={iso} className={`border-r ${gridBd} py-2 px-1 text-center`}>
                <div className={`text-[10px] font-bold uppercase ${subTx}`}>{DAYS_ES[d.getDay()]}</div>
                <button
                  onClick={() => openNew(iso)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black mx-auto mt-0.5 transition-colors
                    ${isToday ? 'bg-yellow-500 text-black' : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {d.getDate()}
                </button>
                {/* All-day & task pills */}
                <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                  {dayEvs.filter(e => e.allDay || e.type === 'tarea').slice(0,3).map(ev => {
                    const c = colorOf(ev.color);
                    return (
                      <button
                        key={ev.id}
                        onClick={() => openEdit(ev)}
                        className={`${c.bg} ${c.text} text-[9px] font-bold px-1.5 py-0.5 rounded-full truncate max-w-[70px] hover:opacity-80`}
                        title={ev.title}
                      >
                        {ev.type === 'tarea' && (ev.taskDone ? '✓ ' : '○ ')}{ev.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="relative" style={{ height: TOTAL_H }}>
            {/* Rows */}
            {HOURS.map(h => (
              <div key={h} className={`absolute w-full border-b ${gridBd}`} style={{ top: h * CELL_H, height: CELL_H }}>
                <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)', height: '100%' }}>
                  <div className={`border-r ${gridBd} flex items-start justify-end pr-2 pt-1`}>
                    <span className={`text-[10px] font-semibold ${subTx}`}>
                      {h === 0 ? '' : `${h < 10 ? '0' : ''}${h}:00`}
                    </span>
                  </div>
                  {weekDays.map(d => (
                    <div
                      key={isoDay(d)}
                      className={`border-r ${gridBd} cursor-pointer hover:${isDark ? 'bg-gray-700/20' : 'bg-yellow-50/40'} transition-colors`}
                      onClick={() => openNew(isoDay(d))}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Events overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ paddingLeft: 56 }}>
              <div className="relative h-full grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {weekDays.map((d, di) => {
                  const iso = isoDay(d);
                  const dayEvts = nonTasksOnDay(iso).filter(e => !e.allDay);
                  return (
                    <div key={iso} className="relative">
                      {dayEvts.map(ev => {
                        const start = parseTime(ev.startTime);
                        const end   = parseTime(ev.endTime) || start + 60;
                        const top   = (start / 60) * CELL_H;
                        const height= Math.max(((end - start) / 60) * CELL_H, 20);
                        const c = colorOf(ev.color);
                        return (
                          <button
                            key={ev.id}
                            onClick={() => openEdit(ev)}
                            className={`absolute left-0.5 right-0.5 ${c.bg} ${c.text} rounded-lg px-1.5 py-1 text-left overflow-hidden pointer-events-auto hover:opacity-90 transition-opacity shadow-sm`}
                            style={{ top, height }}
                          >
                            <p className="text-[10px] font-black leading-tight truncate">{ev.title}</p>
                            <p className="text-[9px] opacity-80 leading-tight">{fmtTime(start)} – {fmtTime(end)}</p>
                            {ev.desc && <p className="text-[9px] opacity-70 truncate mt-0.5">{ev.desc}</p>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current time line */}
            {(() => {
              const todayIdx = weekDays.findIndex(d => isoDay(d) === todayStr);
              if (todayIdx < 0) return null;
              const topPx = (nowMin / 60) * CELL_H;
              const leftPct = (todayIdx / 7) * 100;
              const widthPct = (1 / 7) * 100;
              return (
                <div
                  className="absolute flex items-center pointer-events-none"
                  style={{ top: topPx, left: `calc(56px + ${leftPct}%)`, width: `${widthPct}%` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════
     MONTH VIEW
  ══════════════════════════════════════════════════════ */
  const MonthView = () => {
    const todayStr = isoDay(today());
    const cells = [];
    // empty leading cells
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    // pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div className="flex flex-col flex-1">
        {/* Day names header */}
        <div className={`grid grid-cols-7 border-b ${gridBd} ${hdr}`}>
          {DAYS_ES.map(d => (
            <div key={d} className={`py-3 text-center text-[10px] font-black uppercase tracking-widest ${subTx}`}>{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div className="grid grid-cols-7 flex-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className={`border-b border-r ${gridBd} min-h-[90px] ${isDark ? 'bg-gray-900/20' : 'bg-gray-50/50'}`} />;
            const iso = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = iso === todayStr;
            const dayEvts = eventsOnDay(iso);
            return (
              <div
                key={iso}
                className={`border-b border-r ${gridBd} min-h-[90px] p-1.5 cursor-pointer transition-colors
                  ${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-yellow-50/50'}
                  ${isToday ? isDark ? 'bg-yellow-500/5' : 'bg-yellow-50' : ''}`}
                onClick={() => openNew(iso)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-1
                  ${isToday ? 'bg-yellow-500 text-black' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="flex flex-col gap-0.5">
                  {dayEvts.slice(0, 3).map(ev => {
                    const c = colorOf(ev.color);
                    return (
                      <button
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); openEdit(ev); }}
                        className={`${c.bg} ${c.text} text-[9px] font-bold px-1.5 py-0.5 rounded truncate text-left w-full hover:opacity-80`}
                        title={ev.title}
                      >
                        {ev.type === 'tarea' ? (ev.taskDone ? '✓ ' : '○ ') : ''}{ev.title}
                      </button>
                    );
                  })}
                  {dayEvts.length > 3 && (
                    <span className={`text-[9px] font-semibold ${subTx} pl-1`}>+{dayEvts.length - 3} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════
     AGENDA VIEW
  ══════════════════════════════════════════════════════ */
  const AgendaView = () => {
    const todayStr = isoDay(today());
    // Show 30 days starting from cursor
    const days = Array.from({ length: 30 }, (_, i) => addDays(cursor, i));
    const withEvs = days.filter(d => eventsOnDay(isoDay(d)).length > 0);

    if (withEvs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-20">
          <FaCalendarAlt size={36} className="opacity-20" />
          <p className={`text-sm ${subTx} italic`}>No hay eventos en los próximos 30 días.</p>
          {perm.crear && (
            <button onClick={() => openNew()} className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black transition-colors">
              + Agregar Evento
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {withEvs.map(d => {
          const iso = isoDay(d);
          const isToday = iso === todayStr;
          const dayEvts = eventsOnDay(iso);
          return (
            <div key={iso} className="flex gap-4">
              {/* Date column */}
              <div className="w-20 flex-shrink-0 pt-1 text-right">
                <div className={`text-[10px] font-bold uppercase ${subTx}`}>{DAYS_ES[d.getDay()]}</div>
                <div className={`text-2xl font-black ${isToday ? 'text-yellow-500' : isDark ? 'text-white' : 'text-gray-900'}`}>{d.getDate()}</div>
                <div className={`text-[10px] ${subTx}`}>{MONTHS_ES[d.getMonth()].slice(0,3)}</div>
              </div>
              {/* Events column */}
              <div className="flex-1 flex flex-col gap-2">
                {dayEvts.map(ev => {
                  const c = colorOf(ev.color);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => openEdit(ev)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left w-full transition-colors hover:opacity-90
                        ${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${c.bg}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'} ${ev.type === 'tarea' && ev.taskDone ? 'line-through opacity-60' : ''}`}>
                            {ev.title}
                          </span>
                          {ev.type === 'tarea' && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${ev.taskDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                              {ev.taskDone ? '✓ HECHA' : 'TAREA'}
                            </span>
                          )}
                        </div>
                        {ev.type === 'evento' && !ev.allDay && (
                          <p className={`text-xs mt-0.5 flex items-center gap-1 ${subTx}`}>
                            <FaClock size={9} /> {ev.startTime} – {ev.endTime}
                          </p>
                        )}
                        {ev.allDay && <p className={`text-xs mt-0.5 ${subTx}`}>Todo el día</p>}
                        {ev.desc && <p className={`text-xs mt-1 truncate ${subTx}`}>{ev.desc}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ── title label ───────────────────────────────────── */
  const titleLabel = view === 'semana'
    ? `${MONTHS_ES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${MONTHS_ES[cursor.getMonth()]} ${cursor.getFullYear()}`;

  /* ── stats ─────────────────────────────────────────── */
  const totalEvs   = visibleEvents.filter(e => e.type === 'evento').length;
  const totalTasks = visibleEvents.filter(e => e.type === 'tarea').length;
  const doneTasks  = visibleEvents.filter(e => e.type === 'tarea' && e.taskDone).length;

  /* ══ RENDER ══════════════════════════════════════════ */
  return (
    <div className={`flex flex-col min-h-full -m-6 ${ds.pageBg}`} style={{ height: 'calc(100vh - 0px)' }}>
      <PageHeader
        onBack={() => navigate('/principal')}
        backLabel="Volver al menú"
        right={
          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={loadData}
              title="Actualizar"
              className={`p-2.5 rounded-xl border transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-300 text-gray-500 hover:bg-gray-100'}`}
            >
              <FaSync size={14} />
            </button>
            {/* New event */}
            {perm.crear && (
              <button
                onClick={() => openNew()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm transition-colors"
              >
                <FaPlus size={12} /> Agregar
              </button>
            )}
          </div>
        }
      />

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className={`flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b shrink-0 ${isDark ? 'bg-gray-800/30 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
        {/* Left: calendar type tabs */}
        <div className="flex items-center gap-2">
          <button onClick={() => setCalType('global')} className={calTabBtn(calType === 'global')}>
            <FaGlobe size={11} /> Global
          </button>
          <button onClick={() => setCalType('sucursal')} className={calTabBtn(calType === 'sucursal')}>
            <FaStore size={11} /> {user?.sucursalName || getSucursalName(user?.sucursalId || '1')}
          </button>
        </div>

        {/* Center: navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Hoy
          </button>
          <button onClick={goPrev} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            <FaChevronLeft size={12} />
          </button>
          <button onClick={goNext} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            <FaChevronRight size={12} />
          </button>
          <h2 className={`font-black text-base tracking-tight min-w-[160px] text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {titleLabel}
          </h2>
        </div>

        {/* Right: view tabs + stats */}
        <div className="flex items-center gap-3">
          {/* Mini stats */}
          <div className={`hidden sm:flex items-center gap-3 text-xs ${subTx} border-r pr-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <span className="flex items-center gap-1"><FaCalendarAlt size={9} className="text-indigo-400" /> {totalEvs} eventos</span>
            <span className="flex items-center gap-1"><FaCheck size={9} className="text-emerald-400" /> {doneTasks}/{totalTasks} tareas</span>
          </div>
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
            {[['semana','Semana'],['mes','Mes'],['agenda','Agenda']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} className={tabBtn(view === v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar body ────────────────────────────── */}
      <div className={`flex-1 overflow-hidden flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        {view === 'semana' && <WeekView />}
        {view === 'mes'    && <MonthView />}
        {view === 'agenda' && <AgendaView />}
      </div>

      {/* ── Modal ────────────────────────────────────── */}
      {modal && (
        <EventModal
          initial={modal.initial}
          calType={calType}
          sucursales={sucursales}
          user={user}
          ds={ds}
          onSave={perm.crear || perm.editar ? handleSave : null}
          onDelete={perm.eliminar ? () => handleDelete(modal.initial?.id) : null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default Calendario;
