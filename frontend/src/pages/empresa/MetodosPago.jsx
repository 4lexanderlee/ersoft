import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useDS } from '../../hooks/useDS';
import {
  FaCreditCard, FaMoneyBillWave, FaMobileAlt, FaUniversity, FaTimes, FaSave, FaPencilAlt, FaUpload, FaQrcode, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import PageHeader from '../../components/ui/PageHeader';

const DEFAULT_METODOS = [
  { id: 'cash', nombre: 'Efectivo', tipo: 'cash', activo: true, descripcion: 'Cobros físicos en efectivo de curso legal.', moneda: 'PEN', detalles: {} },
  { id: 'digital', nombre: 'Billetera electrónica', tipo: 'digital', activo: true, descripcion: 'Pagos mediante códigos QR de Yape o Plin.', celular: '975 262 030', titular: 'Alexander Lee', detalles: {} },
  { id: 'bank', nombre: 'Transferencia / CCI', tipo: 'bank', activo: true, descripcion: 'Transferencias bancarias directas e interbancarias.', banco: 'BCP', cuenta: '194-1234567890-1-23', cci: '002-194123456789012396', titular: 'ERSOFT S.A.C.', detalles: {} },
  { id: 'pos', nombre: 'POS', tipo: 'pos', activo: true, descripcion: 'Terminales de pago para tarjetas de débito o crédito.', proveedor: 'Izipay / Niubiz', comision: '3.5', detalles: {} },
];

const PasswordModal = ({ onConfirm, onCancel, theme, ds }) => {
  const [pwd, setPwd]     = useState('');
  const [error, setError] = useState('');
  const { login, user }   = useAuth();

  const handleSubmit = e => {
    e.preventDefault();
    const result = login(user.username, pwd);
    if (result.success) { onConfirm(); }
    else { setError('Contraseña incorrecta. Inténtalo nuevamente.'); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col gap-5 ${ds.cardBg} border`}>
        <h3 className="text-lg font-bold text-center">Confirmar Identidad</h3>
        <p className={`text-sm text-center ${ds.muted}`}>
          Ingresa tu contraseña para guardar los cambios de métodos de pago.
        </p>
        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-xl">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(''); }}
            placeholder="Contraseña"
            autoFocus
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${ds.inputCls}`}
          />
          <div className="flex gap-3">
            <button type="button" onClick={onCancel}
              className={`flex-1 py-2 rounded-xl border font-semibold transition-colors
                ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MetodosPago = () => {
  const ds = useDS();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [metodos, setMetodos] = useState(() => {
    const saved = localStorage.getItem('ersoft_metodos_pago');
    return saved ? JSON.parse(saved) : DEFAULT_METODOS;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMetodo, setEditingMetodo] = useState(null);
  const [form, setForm] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [tempMetodos, setTempMetodos] = useState(metodos);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'save' } | { type: 'toggle', id }

  const qrInputRef = useRef(null);

  useEffect(() => {
    setTempMetodos(metodos);
  }, [metodos]);

  const handleToggleActive = (id) => {
    setPendingAction({ type: 'toggle', id });
    setShowPassword(true);
  };

  const handleOpenEdit = (metodo) => {
    setEditingMetodo(metodo);
    setForm({ ...metodo });
    setModalOpen(true);
  };

  const handleQrUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, qrPath: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleFormSave = (e) => {
    e.preventDefault();
    setPendingAction({ type: 'save' });
    setShowPassword(true);
  };

  const handlePasswordConfirmed = () => {
    setShowPassword(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'toggle') {
      const updated = metodos.map(m => m.id === pendingAction.id ? { ...m, activo: !m.activo } : m);
      setMetodos(updated);
      localStorage.setItem('ersoft_metodos_pago', JSON.stringify(updated));
    } else if (pendingAction.type === 'save') {
      const updated = metodos.map(m => m.id === editingMetodo.id ? { ...form } : m);
      setMetodos(updated);
      localStorage.setItem('ersoft_metodos_pago', JSON.stringify(updated));
      setModalOpen(false);
    }
    setPendingAction(null);
  };

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'cash': return <FaMoneyBillWave size={22} className="text-green-500" />;
      case 'digital': return <FaMobileAlt size={22} className="text-cyan-500" />;
      case 'bank': return <FaUniversity size={22} className="text-yellow-500" />;
      case 'pos': return <FaCreditCard size={22} className="text-purple-500" />;
      default: return <FaCreditCard size={22} className="text-gray-500" />;
    }
  };

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>
      <PageHeader
        backLabel="Volver al menú"
        onBack={() => navigate('/principal')}
      />

      <div className="flex-1 flex flex-col gap-6 px-10 py-6 max-w-5xl mx-auto w-full pb-10 overflow-y-auto">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white">
          <FaCreditCard className="text-yellow-500" />
          <h2 className="font-bold text-base uppercase tracking-wider">Métodos de Pago</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metodos.map(metodo => (
            <div
              key={metodo.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all hover:scale-[1.01] ${ds.cardRaised}
                ${!metodo.activo ? 'opacity-70' : ''}`}
            >
              <div>
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <div className="flex items-center gap-2.5">
                    {getIcon(metodo.tipo)}
                    <h3 className={`font-bold text-base ${ds.text}`}>{metodo.nombre}</h3>
                  </div>
                  <button
                    onClick={() => handleToggleActive(metodo.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 transition-colors
                      ${metodo.activo
                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                  >
                    {metodo.activo ? (
                      <>
                        <FaCheckCircle size={10} /> Activo
                      </>
                    ) : (
                      <>
                        <FaTimesCircle size={10} /> Inactivo
                      </>
                    )}
                  </button>
                </div>

                <p className={`text-xs ${ds.muted} mb-4`}>{metodo.descripcion}</p>

                {/* Display Specific Details */}
                <div className={`p-3 rounded-xl ${ds.cardFlat} text-xs flex flex-col gap-1.5`}>
                  {metodo.tipo === 'cash' && (
                    <div>
                      <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Moneda:</span>
                      <span className={ds.text}>{metodo.moneda || 'PEN (Soles)'}</span>
                    </div>
                  )}

                  {metodo.tipo === 'digital' && (
                    <>
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Celular:</span>
                        <span className={ds.text}>{metodo.celular || '—'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Titular:</span>
                        <span className={ds.text}>{metodo.titular || '—'}</span>
                      </div>
                      {metodo.qrPath && (
                        <div className="flex items-center gap-1.5 mt-1 text-yellow-500 font-semibold">
                          <FaQrcode size={12} /> Código QR configurado
                        </div>
                      )}
                    </>
                  )}

                  {metodo.tipo === 'bank' && (
                    <>
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Banco / Titular:</span>
                        <span className={ds.text}>{metodo.banco || '—'} / {metodo.titular || '—'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Cuenta:</span>
                        <span className={`font-mono ${ds.text}`}>{metodo.cuenta || '—'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">CCI:</span>
                        <span className={`font-mono ${ds.text}`}>{metodo.cci || '—'}</span>
                      </div>
                    </>
                  )}

                  {metodo.tipo === 'pos' && (
                    <>
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Proveedor:</span>
                        <span className={ds.text}>{metodo.proveedor || '—'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Comisión:</span>
                        <span className={ds.text}>{metodo.comision || '0'}% por transacción</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-4">
                <button
                  onClick={() => handleOpenEdit(metodo)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
                >
                  <FaPencilAlt size={10} /> Configurar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CONFIG METODO */}
      {modalOpen && editingMetodo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleFormSave} className={`w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 ${ds.cardBg} border`}>
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                {getIcon(form.tipo)}
                <h3 className={`text-base font-bold ${ds.text}`}>Configurar {form.nombre}</h3>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className={`${ds.muted} hover:${ds.text}`}>
                <FaTimes size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Nombre en Pantalla</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                />
              </div>

              <div>
                <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 resize-none ${ds.inputCls}`}
                />
              </div>

              {/* Specific inputs */}
              {form.tipo === 'cash' && (
                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Moneda Principal</label>
                  <input
                    type="text"
                    value={form.moneda}
                    onChange={e => setForm(prev => ({ ...prev, moneda: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                    placeholder="Ej. PEN"
                  />
                </div>
              )}

              {form.tipo === 'digital' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Celular / Contacto</label>
                      <input
                        type="text"
                        value={form.celular}
                        onChange={e => setForm(prev => ({ ...prev, celular: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                        placeholder="Ej. 999 999 999"
                      />
                    </div>
                    <div>
                      <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Titular</label>
                      <input
                        type="text"
                        value={form.titular}
                        onChange={e => setForm(prev => ({ ...prev, titular: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                        placeholder="Titular de la cuenta"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Código QR de Pago</label>
                    <div className="flex items-center gap-4 mt-1">
                      <div className={`w-20 h-20 rounded-lg border border-dashed flex items-center justify-center overflow-hidden shrink-0 bg-gray-50 dark:bg-gray-700`}>
                        {form.qrPath ? (
                          <img src={form.qrPath} alt="QR Pago" className="w-full h-full object-contain" />
                        ) : (
                          <FaQrcode size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => qrInputRef.current?.click()}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                            ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'}`}
                        >
                          <FaUpload size={10} /> Subir QR (PNG/JPG)
                        </button>
                        <input ref={qrInputRef} type="file" accept="image/png,image/jpeg" onChange={handleQrUpload} className="hidden" />
                        {form.qrPath && (
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, qrPath: null }))}
                            className="text-[10px] text-red-500 text-left hover:underline"
                          >
                            Eliminar imagen QR
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {form.tipo === 'bank' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Banco</label>
                      <input
                        type="text"
                        value={form.banco}
                        onChange={e => setForm(prev => ({ ...prev, banco: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                        placeholder="Ej. BCP"
                      />
                    </div>
                    <div>
                      <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Titular</label>
                      <input
                        type="text"
                        value={form.titular}
                        onChange={e => setForm(prev => ({ ...prev, titular: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                        placeholder="Ej. ERSOFT SAC"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Número de Cuenta</label>
                    <input
                      type="text"
                      value={form.cuenta}
                      onChange={e => setForm(prev => ({ ...prev, cuenta: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono ${ds.inputCls}`}
                      placeholder="Número de cuenta bancaria"
                    />
                  </div>
                  <div>
                    <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Código de Cuenta Interbancario (CCI)</label>
                    <input
                      type="text"
                      value={form.cci}
                      onChange={e => setForm(prev => ({ ...prev, cci: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono ${ds.inputCls}`}
                      placeholder="CCI de la cuenta"
                    />
                  </div>
                </>
              )}

              {form.tipo === 'pos' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Proveedor</label>
                    <input
                      type="text"
                      value={form.proveedor}
                      onChange={e => setForm(prev => ({ ...prev, proveedor: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                      placeholder="Ej. Izipay"
                    />
                  </div>
                  <div>
                    <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Comisión (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.comision}
                      onChange={e => setForm(prev => ({ ...prev, comision: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                      placeholder="Ej. 3.5"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors
                  ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors flex items-center gap-1.5"
              >
                <FaSave size={13} /> Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {showPassword && (
        <PasswordModal
          onConfirm={handlePasswordConfirmed}
          onCancel={() => setShowPassword(false)}
          theme={theme}
          ds={ds}
        />
      )}
    </div>
  );
};

export default MetodosPago;
