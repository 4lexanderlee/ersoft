import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useInventario } from '../context/InventarioContext';
import { FaArrowLeft, FaPlus, FaBoxOpen } from 'react-icons/fa';

const Lotes = () => {
  const { theme } = useTheme();
  const { user, login } = useAuth();
  const { lotes, createLote, cerrarLote } = useInventario();
  const navigate = useNavigate();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [closingLoteId, setClosingLoteId] = useState(null);
  const [closePwd, setClosePwd] = useState('');
  const [closeError, setCloseError] = useState('');

  const pageBg = theme === 'dark' ? 'bg-[#313b48]' : 'bg-[#d6d0d4]';
  const headerBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-[#e8e3e8] border-gray-200';
  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const muted = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const inputCls = theme === 'dark'
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500';

  // Sort: active first, then by creation date (newest first)
  const sorted = [...lotes].sort((a, b) => {
    if (a.estado === 'Activo' && b.estado !== 'Activo') return -1;
    if (a.estado !== 'Activo' && b.estado === 'Activo') return 1;
    return b.id - a.id;
  });

  const handleCreate = () => {
    if (!nombre.trim()) return;
    const r = login(user.username, pwd);
    if (!r.success) { setPwdError('Contraseña incorrecta'); return; }
    createLote(nombre.trim());
    setNombre(''); setPwd(''); setPwdError(''); setShowCreateForm(false);
  };

  const handleClose = () => {
    const r = login(user.username, closePwd);
    if (!r.success) { setCloseError('Contraseña incorrecta'); return; }
    cerrarLote(closingLoteId);
    setClosingLoteId(null); setClosePwd(''); setCloseError('');
  };

  return (
    <div className={`flex flex-col min-h-full -m-6 ${pageBg}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-8 py-4 border-b ${headerBg}`}>
        <button onClick={() => navigate('/inventario')} className={`flex items-center gap-2 font-bold text-lg hover:opacity-70 transition-colors ${text}`}>
          <FaArrowLeft /> Inventario
        </button>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm"
        >
          <FaPlus /> Nuevo Lote
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className={`mx-8 mt-5 p-6 rounded-2xl border ${cardBg}`}>
          <h3 className={`font-bold text-base mb-4 ${text}`}>Crear Nuevo Lote</h3>
          <div className="space-y-4">
            <div>
              <label className={`text-xs uppercase font-semibold ${muted}`}>Nombre del Lote</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="ej. Lote Enero 2026"
                className={`w-full mt-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} />
            </div>
            <div className={`text-sm ${muted}`}>
              Fecha de creación: <span className="font-semibold">{new Date().toLocaleDateString('es-PE')}</span>
            </div>
            <div>
              <label className={`text-xs uppercase font-semibold ${muted}`}>Confirmar con contraseña</label>
              {pwdError && <p className="text-red-400 text-xs mt-1">{pwdError}</p>}
              <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setPwdError(''); }}
                placeholder="Contraseña del master"
                className={`w-full mt-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCreateForm(false); setNombre(''); setPwd(''); }}
                className={`flex-1 py-2 rounded-xl border font-semibold text-sm ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                Cancelar
              </button>
              <button onClick={handleCreate}
                className="flex-1 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm">
                Crear Lote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lots grid */}
      <div className="flex-1 px-8 py-5">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <FaBoxOpen size={48} className={muted} />
            <p className={`font-medium ${muted}`}>No hay lotes creados. Crea tu primer lote.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(lote => {
              const isActive = lote.estado === 'Activo';
              return (
                <div key={lote.id}
                  className={`rounded-2xl border p-5 flex flex-col gap-3 ${cardBg}
                    ${isActive ? (theme === 'dark' ? 'border-yellow-500/50 ring-1 ring-yellow-500/30' : 'border-yellow-400 ring-1 ring-yellow-300') : ''}`}>
                  {/* Status badge */}
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-base ${text}`}>{lote.nombre}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {lote.estado}
                    </span>
                  </div>
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className={muted}>Fecha inicio</span>
                    <span className={`font-semibold ${text}`}>{lote.fechaCreacion}</span>
                    {lote.fechaCierre && <>
                      <span className={muted}>Fecha cierre</span>
                      <span className={`font-semibold ${text}`}>{lote.fechaCierre}</span>
                    </>}
                    <span className={muted}>Total productos</span>
                    <span className={`font-semibold ${text}`}>{lote.totalProductos}</span>
                  </div>
                  {/* Close toggle */}
                  {isActive && (
                    <button
                      onClick={() => setClosingLoteId(lote.id)}
                      className="mt-1 py-2 px-4 rounded-xl border-2 border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors"
                    >
                      ⚠ Cerrar Lote
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="py-2 text-center text-xs text-gray-400 bg-black">®Todos los derechos reservados. ERSOFT</div>

      {/* Close Lot Password Modal */}
      {closingLoteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl p-7 flex flex-col gap-5 shadow-2xl ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚠</span>
              </div>
              <h3 className="font-bold text-lg">Cerrar Lote</h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Esta acción es <strong>irreversible</strong>. Una vez cerrado el lote no podrá reactivarse.
              </p>
            </div>
            {closeError && <p className="text-red-400 text-sm text-center">{closeError}</p>}
            <input type="password" value={closePwd} onChange={e => { setClosePwd(e.target.value); setCloseError(''); }}
              placeholder="Ingresa tu contraseña para confirmar" autoFocus
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${inputCls}`} />
            <div className="flex gap-3">
              <button onClick={() => { setClosingLoteId(null); setClosePwd(''); setCloseError(''); }}
                className={`flex-1 py-2 rounded-xl border font-semibold text-sm ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                Cancelar
              </button>
              <button onClick={handleClose}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm">
                Confirmar Cierre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lotes;
