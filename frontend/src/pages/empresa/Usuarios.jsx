import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useDS } from '../../hooks/useDS';
import {
  FaUsers, FaPlus, FaPencilAlt, FaTrash, FaUserCheck, FaUserTimes, FaTimes, FaSave, FaSearch, FaFilter, FaCalendarAlt, FaIdCard
} from 'react-icons/fa';
import PageHeader from '../../components/ui/PageHeader';
import RefreshButton from '../../components/ui/RefreshButton';

const DEFAULT_USUARIOS = [
  { id: '1', name: 'Alexander Lee Melgarejo', email: 'melgarejorom@gmail.com', password: 'master123', role: 'Administrador', sucursalId: '1', sucursal: 'Sede Principal', status: 'Activo', docType: 'DNI', docNumber: '12345678', created_en: '15/01/2025', sexo: 'Masculino', telefono: '975262030' },
  { id: '2', name: 'Juan Perez Lopez', email: 'juan_vendedor@ersoft.com', password: '123456', role: 'Vendedor', sucursalId: '2', sucursal: 'Sede Norte', status: 'Activo', docType: 'DNI', docNumber: '87654321', created_en: '10/02/2025', sexo: 'Masculino', telefono: '987654321' },
  { id: '3', name: 'Maria Gomez Garcia', email: 'maria_cajero@ersoft.com', password: '123456', role: 'Cajero', sucursalId: '3', sucursal: 'Sede Sur', status: 'Activo', docType: 'CE', docNumber: '987654321', created_en: '20/03/2025', sexo: 'Femenino', telefono: '912345678' },
  { id: '4', name: 'Pedro Rojas Diaz', email: 'pedro_almacen@ersoft.com', password: '123456', role: 'Almacenero', sucursalId: '1', sucursal: 'Sede Principal', status: 'Inactivo', docType: 'DNI', docNumber: '43218765', created_en: '22/04/2025', sexo: 'Masculino', telefono: '998877665' },
];

const DEFAULT_ROLES = ['Administrador', 'Vendedor', 'Cajero', 'Almacenero'];

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

const Usuarios = () => {
  const ds = useDS();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [sucursales] = useState(() => {
    const saved = localStorage.getItem('ersoft_sucursales');
    return saved ? JSON.parse(saved) : [
      { id: '1', nombre: 'Sede Principal' },
      { id: '2', nombre: 'Sede Norte' },
      { id: '3', nombre: 'Sede Sur' },
    ];
  });

  const [roles] = useState(() => {
    const saved = localStorage.getItem('ersoft_roles_permisos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const keys = Object.keys(parsed);
        if (keys.length > 0) return keys;
      } catch (e) {
        console.error('Error loading roles from localStorage:', e);
      }
    }
    return DEFAULT_ROLES;
  });

  const [usuarios, setUsuarios] = useState(() => {
    const saved = localStorage.getItem('ersoft_usuarios');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((u, i) => ({
          ...u,
          password: u.password || (u.id === '1' ? 'master123' : '123456'),
          email: u.id === '1' ? 'melgarejorom@gmail.com' : (u.email || (u.username ? `${u.username}@ersoft.com` : `usuario${i}@ersoft.com`)),
          docType: u.docType || 'DNI',
          docNumber: u.docNumber || '12345678',
          created_en: u.created_en || '15/01/2025',
          sexo: u.sexo || (u.id === '3' ? 'Femenino' : 'Masculino'),
          telefono: u.telefono || '999999999',
        }));
      } catch (e) {
        return DEFAULT_USUARIOS;
      }
    }
    return DEFAULT_USUARIOS;
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [sucursalFilter, setSucursalFilter] = useState('Todos');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Vendedor', sucursalId: '1', status: 'Activo', docType: 'DNI', docNumber: '', sexo: 'Masculino', telefono: '' });
  const [errors, setErrors] = useState({});

  // Password verification states
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'save' | 'delete' | 'toggle', id?: string, nextStatus?: string }

  useEffect(() => {
    localStorage.setItem('ersoft_usuarios', JSON.stringify(usuarios));
  }, [usuarios]);

  const handleRefresh = () => {
    const saved = localStorage.getItem('ersoft_usuarios');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUsuarios(parsed.map((u, i) => ({
          ...u,
          password: u.password || (u.id === '1' ? 'master123' : '123456'),
          email: u.id === '1' ? 'melgarejorom@gmail.com' : (u.email || (u.username ? `${u.username}@ersoft.com` : `usuario${i}@ersoft.com`)),
          docType: u.docType || 'DNI',
          docNumber: u.docNumber || '12345678',
          created_en: u.created_en || '15/01/2025',
          sexo: u.sexo || (u.id === '3' ? 'Femenino' : 'Masculino'),
          telefono: u.telefono || '999999999',
        })));
      } catch (e) {
        console.error('Error refreshing users:', e);
      }
    }
  };

  const validate = () => {
    const temp = {};
    if (!form.name.trim()) {
      temp.name = 'El nombre completo es obligatorio.';
    } else if (form.name.length > 60) {
      temp.name = 'El nombre no puede superar los 60 caracteres.';
    }

    if (!form.email.trim()) {
      temp.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      temp.email = 'El formato del correo es inválido.';
    } else if (form.email.length > 50) {
      temp.email = 'El correo no puede superar los 50 caracteres.';
    } else if (usuarios.some(u => u.email.toLowerCase() === form.email.trim().toLowerCase() && (!editingUser || u.id !== editingUser.id))) {
      temp.email = 'Este correo ya está registrado.';
    }

    if (!editingUser && !form.password) {
      temp.password = 'La contraseña es obligatoria.';
    }

    if (!form.docNumber.trim()) {
      temp.docNumber = 'El número de documento es obligatorio.';
    } else {
      const expectedLength = form.docType === 'DNI' ? 8 : 9;
      if (!/^\d+$/.test(form.docNumber.trim())) {
        temp.docNumber = 'El número de documento debe contener solo dígitos.';
      } else if (form.docNumber.trim().length !== expectedLength) {
        temp.docNumber = `El ${form.docType} debe tener exactamente ${expectedLength} dígitos.`;
      }
    }

    if (!form.telefono || !form.telefono.trim()) {
      temp.telefono = 'El teléfono es obligatorio.';
    } else if (!/^\d{9}$/.test(form.telefono.trim())) {
      temp.telefono = 'El teléfono debe tener exactamente 9 dígitos.';
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    const defaultRole = roles.includes('Vendedor') ? 'Vendedor' : (roles[0] || 'Administrador');
    setForm({
      name: '',
      email: '',
      password: '',
      role: defaultRole,
      sucursalId: sucursales[0]?.id || '1',
      status: 'Activo',
      docType: 'DNI',
      docNumber: '',
      sexo: 'Masculino',
      telefono: ''
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setForm({ ...user, password: '', sexo: user.sexo || 'Masculino', telefono: user.telefono || '' });
    setErrors({});
    setModalOpen(true);
  };

  const handleDeleteClick = (id, email) => {
    if (id === '1') {
      alert('El usuario administrador maestro no puede ser eliminado.');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el usuario "${email}"?`)) {
      setPendingAction({ type: 'delete', id });
      setShowPassword(true);
    }
  };

  const handleToggleStatusClick = (id, nextStatus) => {
    if (id === '1') {
      alert('No puedes desactivar el usuario administrador maestro.');
      return;
    }
    setPendingAction({ type: 'toggle', id, nextStatus });
    setShowPassword(true);
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
      setUsuarios(prev => prev.filter(item => item.id !== pendingAction.id));
    } else if (pendingAction.type === 'toggle') {
      setUsuarios(prev => prev.map(item => {
        if (item.id === pendingAction.id) {
          return { ...item, status: pendingAction.nextStatus };
        }
        return item;
      }));
    } else if (pendingAction.type === 'save') {
      const branch = sucursales.find(s => s.id === form.sucursalId) || sucursales[0];
      const sucursalName = branch ? (branch.nombre || branch.nombreComercial) : '—';

      if (editingUser) {
        setUsuarios(prev => prev.map(item => item.id === editingUser.id ? {
          ...item,
          name: form.name,
          email: form.email,
          role: form.role,
          sucursalId: form.sucursalId,
          sucursal: sucursalName,
          status: form.status,
          docType: form.docType,
          docNumber: form.docNumber,
          sexo: form.sexo || 'Masculino',
          telefono: form.telefono,
          ...(form.password ? { password: form.password } : {})
        } : item));
      } else {
        const newId = Date.now().toString();
        setUsuarios(prev => [...prev, {
          id: newId,
          name: form.name,
          email: form.email,
          role: form.role,
          sucursalId: form.sucursalId,
          sucursal: sucursalName,
          status: form.status,
          password: form.password,
          docType: form.docType,
          docNumber: form.docNumber,
          sexo: form.sexo || 'Masculino',
          telefono: form.telefono,
          created_en: new Date().toLocaleDateString('es-PE'),
        }]);
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

  const filteredUsers = usuarios.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'Todos' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'Todos' || u.status === statusFilter;
    const matchesSucursal = sucursalFilter === 'Todos' || u.sucursalId === sucursalFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesSucursal;
  });

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>
      <PageHeader
        backLabel="Volver al menú"
        onBack={() => navigate('/principal')}
        right={
          <div className="flex items-center gap-3">
            <RefreshButton onRefresh={handleRefresh} />
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors"
            >
              <FaPlus size={12} /> Agregar Usuario
            </button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col gap-6 px-10 py-6 max-w-7xl mx-auto w-full pb-10 overflow-y-auto">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white">
          <FaUsers className="text-yellow-500" />
          <h2 className="font-bold text-base uppercase tracking-wider">Usuarios del Sistema</h2>
        </div>

        {/* Filters Bar */}
        <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${ds.cardBg}`}>
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="relative w-full">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
              <FaFilter size={11} /> Filtros:
            </div>
            
            {/* Filter by Sucursal */}
            <select
              value={sucursalFilter}
              onChange={e => setSucursalFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
            >
              <option value="Todos">Todas las Sucursales</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre || s.nombreComercial}</option>)}
            </select>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
            >
              <option value="Todos">Todos los Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className={`rounded-2xl border overflow-x-auto ${ds.cardBg}`}>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Nombre Completo</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Documento</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Correo</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Rol</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Sucursal</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Creado En</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Estado</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-right ${ds.muted}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-700">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                  <td className={`px-6 py-4 text-sm font-semibold ${ds.text}`}>{u.name}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 font-mono">
                      <FaIdCard className="text-gray-400" size={12} />
                      <span className="font-bold text-yellow-600 dark:text-yellow-400 text-xs">[{u.docType}]</span> {u.docNumber}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-mono ${ds.text}`}>{u.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400`}>
                      {u.role}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${ds.text}`}>{u.sucursal}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      <FaCalendarAlt size={11} /> {u.created_en || '15/01/2025'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleToggleStatusClick(u.id, u.status === 'Activo' ? 'Inactivo' : 'Activo')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 transition-colors
                        ${u.status === 'Activo'
                          ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                          : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                    >
                      {u.status === 'Activo' ? (
                        <>
                          <FaUserCheck size={11} /> Activo
                        </>
                      ) : (
                        <>
                          <FaUserTimes size={11} /> Inactivo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex justify-end gap-2.5">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className={`p-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 ${ds.muted} hover:${ds.text}`}
                        title="Editar Usuario"
                      >
                        <FaPencilAlt size={12} />
                      </button>
                      {u.id !== '1' && (
                        <button
                          onClick={() => handleDeleteClick(u.id, u.email)}
                          className={`p-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/25 text-red-500 transition-colors`}
                          title="Eliminar Usuario"
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="8" className={`text-center py-10 ${ds.muted} text-sm`}>
                    No se encontraron usuarios con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL USER ADD / EDIT */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveClick} className={`w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 ${ds.cardBg} border`}>
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className={`text-lg font-bold ${ds.text}`}>
                {editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className={`${ds.muted} hover:${ds.text}`}>
                <FaTimes size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Nombre Completo <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  maxLength={60}
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Ej. Alexander Lee Melgarejo"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Document Type Selector & Document Number */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Doc <span className="text-red-400">*</span></label>
                  <select
                    value={form.docType}
                    onChange={e => {
                      const newType = e.target.value;
                      setForm(prev => ({ ...prev, docType: newType, docNumber: '' }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">C.E.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Número Documento <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    maxLength={form.docType === 'DNI' ? 8 : 9}
                    value={form.docNumber}
                    onKeyDown={onlyDigitsKey}
                    onChange={e => setForm(prev => ({ ...prev, docNumber: e.target.value.replace(/\D/g, '') }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.docNumber ? 'border-red-500' : ''}`}
                    placeholder={form.docType === 'DNI' ? '8 dígitos' : '9 dígitos'}
                  />
                  {errors.docNumber && <p className="text-red-400 text-xs mt-1">{errors.docNumber}</p>}
                </div>
              </div>

              <div>
                <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Teléfono <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  maxLength={9}
                  value={form.telefono || ''}
                  onKeyDown={onlyDigitsKey}
                  onChange={e => setForm(prev => ({ ...prev, telefono: e.target.value.replace(/\D/g, '') }))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.telefono ? 'border-red-500' : ''}`}
                  placeholder="9 dígitos"
                />
                {errors.telefono && <p className="text-red-400 text-xs mt-1">{errors.telefono}</p>}
              </div>

              {/* Datos de Acceso Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 space-y-3 bg-gray-50/50 dark:bg-gray-800/30">
                <p className={`text-xs font-bold uppercase tracking-wider ${ds.text}`}>Datos de Acceso</p>
                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Correo Electrónico <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    maxLength={50}
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="Ej. alexander@ersoft.com"
                    disabled={editingUser && editingUser.id === '1'}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>
                    {editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'} <span className="text-red-400">{editingUser ? '' : '*'}</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls} ${errors.password ? 'border-red-500' : ''}`}
                    placeholder={editingUser ? 'Sin cambiar' : '••••••••'}
                  />
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Rol</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                    disabled={editingUser && editingUser.id === '1'}
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    {form.role && !roles.includes(form.role) && (
                      <option value={form.role}>{form.role} (Eliminado)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Sucursal</label>
                  <select
                    value={form.sucursalId}
                    onChange={e => setForm(prev => ({ ...prev, sucursalId: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                  >
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre || s.nombreComercial}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={editingUser ? "col-span-1" : "col-span-2"}>
                  <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Género</label>
                  <select
                    value={form.sexo || 'Masculino'}
                    onChange={e => setForm(prev => ({ ...prev, sexo: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>

                {editingUser && (
                  <div>
                    <label className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${ds.muted}`}>Estado</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                      disabled={editingUser.id === '1'}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                )}
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
                <FaSave size={13} /> {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
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

export default Usuarios;
