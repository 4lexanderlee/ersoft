import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { useDS } from '../../hooks/useDS';
import {
  FaPlus, FaPencilAlt, FaTrash, FaBuilding, FaMapMarkerAlt, FaPhoneAlt, FaUser, FaTimes, FaSave, FaCalendarAlt
} from 'react-icons/fa';
import PageHeader from '../../components/ui/PageHeader';

const DEFAULT_SUCURSALES = [
  { id: '1', nombre: 'Sede Principal', direccion: 'Av. Pardo y Aliaga 640, Piso 3', telefono: '975262030', distrito: 'Miraflores', ciudad: 'Lima', encargado: 'Alexander Lee', codigoEstablecimiento: '0000', ubigeo: '150122', fechaCreacion: '15/01/2025' },
  { id: '2', nombre: 'Sede Norte', direccion: 'Av. Alfredo Mendiola 3600', telefono: '987654321', distrito: 'Los Olivos', ciudad: 'Lima', encargado: 'Juan Perez', codigoEstablecimiento: '0001', ubigeo: '150117', fechaCreacion: '10/02/2025' },
  { id: '3', nombre: 'Sede Sur', direccion: 'Av. Ejercito 710', telefono: '954282930', distrito: 'Yanahuara', ciudad: 'Arequipa', encargado: 'Maria Gomez', codigoEstablecimiento: '0002', ubigeo: '040120', fechaCreacion: '20/03/2025' },
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
          Ingresa tu contraseña para realizar esta acción de configuración.
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

const Sucursales = () => {
  const ds = useDS();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { empresa, updateEmpresa } = useEmpresa();

  const [sucursales, setSucursales] = useState(() => {
    const saved = localStorage.getItem('ersoft_sucursales');
    return saved ? JSON.parse(saved) : DEFAULT_SUCURSALES;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    distrito: '',
    ciudad: '',
    encargado: '',
    codigoEstablecimiento: '',
    ubigeo: ''
  });
  const [errors, setErrors] = useState({});

  // Password confirmation states
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'save' | 'delete', id?: string }

  useEffect(() => {
    localStorage.setItem('ersoft_sucursales', JSON.stringify(sucursales));
  }, [sucursales]);

  // Sync Sede Principal's fields dynamically from empresa context
  const displaySucursales = sucursales.map(branch => {
    if (branch.id === '1') {
      return {
        ...branch,
        nombre: 'Sede Principal',
        direccion: empresa.direccion || branch.direccion,
        distrito: empresa.distrito || branch.distrito,
        ciudad: empresa.ciudad || branch.ciudad,
        telefono: empresa.telefono || branch.telefono,
        encargado: empresa.encargado || branch.encargado,
        codigoEstablecimiento: empresa.codigoEstablecimiento || branch.codigoEstablecimiento || '0000',
        ubigeo: empresa.ubigeo || branch.ubigeo || '150122',
        fechaCreacion: branch.fechaCreacion || '15/01/2025',
      };
    }
    return {
      ...branch,
      fechaCreacion: branch.fechaCreacion || '15/01/2025',
    };
  });

  const validate = () => {
    const temp = {};
    if (!form.nombre.trim()) {
      temp.nombre = 'El nombre de la sucursal es obligatorio.';
    } else if (form.nombre.length > 40) {
      temp.nombre = 'El nombre no puede superar los 40 caracteres.';
    }

    if (!form.direccion.trim()) {
      temp.direccion = 'La dirección es obligatoria.';
    } else if (form.direccion.length > 100) {
      temp.direccion = 'La dirección no puede superar los 100 caracteres.';
    }

    if (!form.distrito.trim()) {
      temp.distrito = 'El distrito es obligatorio.';
    } else if (/\d/.test(form.distrito)) {
      temp.distrito = 'El distrito no debe contener números.';
    } else if (form.distrito.length > 30) {
      temp.distrito = 'El distrito no puede superar los 30 caracteres.';
    }

    if (!form.ciudad.trim()) {
      temp.ciudad = 'La ciudad es obligatoria.';
    } else if (/\d/.test(form.ciudad)) {
      temp.ciudad = 'La ciudad no debe contener números.';
    } else if (form.ciudad.length > 30) {
      temp.ciudad = 'La ciudad no puede superar los 30 caracteres.';
    }

    if (!form.telefono.trim()) {
      temp.telefono = 'El teléfono es obligatorio.';
    } else if (!/^\d{9}$/.test(form.telefono.trim())) {
      temp.telefono = 'El teléfono debe tener exactamente 9 dígitos numéricos.';
    }

    if (!form.codigoEstablecimiento.trim()) {
      temp.codigoEstablecimiento = 'El código de establecimiento es obligatorio.';
    } else if (!/^\d{4}$/.test(form.codigoEstablecimiento.trim())) {
      temp.codigoEstablecimiento = 'El código de establecimiento debe tener exactamente 4 dígitos numéricos.';
    }

    if (!form.ubigeo.trim()) {
      temp.ubigeo = 'El UBIGEO es obligatorio.';
    } else if (!/^\d{6}$/.test(form.ubigeo.trim())) {
      temp.ubigeo = 'El UBIGEO debe tener exactamente 6 dígitos numéricos.';
    }

    if (form.encargado && form.encargado.length > 40) {
      temp.encargado = 'El encargado no puede superar los 40 caracteres.';
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setForm({
      nombre: '',
      direccion: '',
      telefono: '',
      distrito: '',
      ciudad: '',
      encargado: '',
      codigoEstablecimiento: '',
      ubigeo: ''
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (branch) => {
    const actualBranch = displaySucursales.find(b => b.id === branch.id) || branch;
    setEditingBranch(actualBranch);
    setForm({ ...actualBranch });
    setErrors({});
    setModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    if (id === '1') return; // Cannot delete Sede Principal
    if (window.confirm('¿Estás seguro de eliminar esta sucursal?')) {
      setPendingAction({ type: 'delete', id });
      setShowPassword(true);
    }
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setPendingAction({ type: 'save' });
    setShowPassword(true);
  };

  const handlePasswordConfirmed = () => {
    setShowPassword(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'delete') {
      setSucursales(prev => prev.filter(item => item.id !== pendingAction.id));
    } else if (pendingAction.type === 'save') {
      if (editingBranch) {
        if (editingBranch.id === '1') {
          updateEmpresa({
            direccion: form.direccion,
            distrito: form.distrito,
            ciudad: form.ciudad,
            telefono: form.telefono,
            encargado: form.encargado,
            codigoEstablecimiento: form.codigoEstablecimiento,
            ubigeo: form.ubigeo,
          });
        }
        setSucursales(prev => prev.map(item => item.id === editingBranch.id ? { ...form } : item));
      } else {
        const newId = Date.now().toString();
        const newBranch = {
          ...form,
          id: newId,
          fechaCreacion: new Date().toLocaleDateString('es-PE'),
        };
        setSucursales(prev => [...prev, newBranch]);
      }
      setModalOpen(false);
    }
    setPendingAction(null);
  };

  const onlyDigitsKey = e => {
    if (!/[\d\b]/.test(e.key) && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  const noDigitsKey = e => {
    if (/\d/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>
      <PageHeader
        backLabel="Volver al menú"
        onBack={() => navigate('/principal')}
        right={
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors"
          >
            <FaPlus size={12} /> Agregar Sucursal
          </button>
        }
      />

      <div className="flex-1 flex flex-col gap-6 px-10 py-6 max-w-5xl mx-auto w-full pb-10 overflow-y-auto">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white">
          <FaBuilding className="text-yellow-500" />
          <h2 className="font-bold text-base uppercase tracking-wider">Sucursales de la Empresa</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displaySucursales.map(branch => (
            <div
              key={branch.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all hover:scale-[1.01] ${ds.cardRaised}`}
            >
              <div>
                <div className="flex justify-between items-start mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-bold text-lg text-yellow-500 dark:text-yellow-400 truncate">{branch.nombre}</h3>
                    {branch.codigoEstablecimiento && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        Cód. SUNAT: {branch.codigoEstablecimiento}
                      </span>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 shrink-0`}>
                    {branch.ciudad}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 text-sm my-4">
                  <div className="flex items-start gap-2.5">
                    <FaMapMarkerAlt className="text-gray-400 mt-1 shrink-0" size={14} />
                    <span className={ds.text}>{branch.direccion}, {branch.distrito}</span>
                  </div>
                  {branch.ubigeo && (
                    <div className="flex items-center gap-2.5">
                      <span className="text-gray-400 font-bold text-xs shrink-0 select-none">UBI</span>
                      <span className={ds.text}>UBIGEO: {branch.ubigeo}</span>
                    </div>
                  )}
                  {branch.telefono && (
                    <div className="flex items-center gap-2.5">
                      <FaPhoneAlt className="text-gray-400 shrink-0" size={14} />
                      <span className={ds.text}>{branch.telefono}</span>
                    </div>
                  )}
                  {branch.encargado && (
                    <div className="flex items-center gap-2.5">
                      <FaUser className="text-gray-400 shrink-0" size={14} />
                      <span className={ds.text}>Encargado: {branch.encargado}</span>
                    </div>
                  )}
                  {branch.fechaCreacion && (
                    <div className="flex items-center gap-2.5">
                      <FaCalendarAlt className="text-gray-400 shrink-0" size={14} />
                      <span className={`${ds.text} text-xs text-gray-400`}>Creado el: {branch.fechaCreacion}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-2">
                <button
                  onClick={() => handleOpenEdit(branch)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
                >
                  <FaPencilAlt size={11} /> Editar
                </button>
                {branch.id !== '1' && (
                  <button
                    onClick={() => handleDeleteClick(branch.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                  >
                    <FaTrash size={11} /> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
          {displaySucursales.length === 0 && (
            <div className={`col-span-2 text-center py-10 rounded-2xl border ${ds.cardFlat}`}>
              <FaBuilding size={40} className="mx-auto mb-3 text-gray-400" />
              <p className={ds.text}>No hay sucursales registradas.</p>
              <button onClick={handleOpenAdd} className="text-yellow-500 hover:text-yellow-400 font-bold mt-2 text-sm">
                Registra la primera sucursal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDIT / CREATE */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveClick} className={`w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4 ${ds.cardBg} border`}>
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className={`text-lg font-bold ${ds.text}`}>
                {editingBranch ? 'Editar Sucursal' : 'Agregar Nueva Sucursal'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className={`${ds.muted} hover:${ds.text}`}>
                <FaTimes size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Nombre Sucursal <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  maxLength={40}
                  disabled={editingBranch?.id === '1'}
                  value={form.nombre}
                  onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.nombre ? 'border-red-500' : ''} ${editingBranch?.id === '1' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="Ej. Sucursal Miraflores"
                />
                {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Dirección <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.direccion}
                  onChange={e => setForm(prev => ({ ...prev, direccion: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.direccion ? 'border-red-500' : ''}`}
                  placeholder="Av. Principal 123"
                />
                {errors.direccion && <p className="text-red-400 text-xs mt-1">{errors.direccion}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Distrito <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    maxLength={30}
                    value={form.distrito}
                    onChange={e => setForm(prev => ({ ...prev, distrito: e.target.value }))}
                    onKeyDown={noDigitsKey}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.distrito ? 'border-red-500' : ''}`}
                    placeholder="Miraflores"
                  />
                  {errors.distrito && <p className="text-red-400 text-xs mt-1">{errors.distrito}</p>}
                </div>
                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Ciudad <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    maxLength={30}
                    value={form.ciudad}
                    onChange={e => setForm(prev => ({ ...prev, ciudad: e.target.value }))}
                    onKeyDown={noDigitsKey}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.ciudad ? 'border-red-500' : ''}`}
                    placeholder="Lima"
                  />
                  {errors.ciudad && <p className="text-red-400 text-xs mt-1">{errors.ciudad}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Teléfono (9 dígitos) <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    maxLength={9}
                    value={form.telefono}
                    onChange={e => setForm(prev => ({ ...prev, telefono: e.target.value.replace(/\D/g, '') }))}
                    onKeyDown={onlyDigitsKey}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.telefono ? 'border-red-500' : ''}`}
                    placeholder="975262030"
                  />
                  {errors.telefono && <p className="text-red-400 text-xs mt-1">{errors.telefono}</p>}
                </div>
                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Encargado</label>
                  <input
                    type="text"
                    maxLength={40}
                    value={form.encargado}
                    onChange={e => setForm(prev => ({ ...prev, encargado: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.encargado ? 'border-red-500' : ''}`}
                    placeholder="Nombre del Encargado"
                  />
                  {errors.encargado && <p className="text-red-400 text-xs mt-1">{errors.encargado}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Código Establecimiento (SUNAT) <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    maxLength={4}
                    value={form.codigoEstablecimiento}
                    onChange={e => setForm(prev => ({ ...prev, codigoEstablecimiento: e.target.value.replace(/\D/g, '') }))}
                    onKeyDown={onlyDigitsKey}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.codigoEstablecimiento ? 'border-red-500' : ''}`}
                    placeholder="0000"
                  />
                  {errors.codigoEstablecimiento && <p className="text-red-400 text-xs mt-1">{errors.codigoEstablecimiento}</p>}
                </div>
                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>UBIGEO <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    maxLength={6}
                    value={form.ubigeo}
                    onChange={e => setForm(prev => ({ ...prev, ubigeo: e.target.value.replace(/\D/g, '') }))}
                    onKeyDown={onlyDigitsKey}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.ubigeo ? 'border-red-500' : ''}`}
                    placeholder="150122"
                  />
                  {errors.ubigeo && <p className="text-red-400 text-xs mt-1">{errors.ubigeo}</p>}
                </div>
              </div>
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
                <FaSave size={13} /> {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showPassword && (
        <PasswordModal
          onConfirm={handlePasswordConfirmed}
          onCancel={() => { setShowPassword(false); setPendingAction(null); }}
          theme={theme}
          ds={ds}
        />
      )}
    </div>
  );
};

export default Sucursales;
