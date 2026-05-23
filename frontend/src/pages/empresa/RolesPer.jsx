import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useDS } from '../../hooks/useDS';
import {
  FaUserShield, FaSave, FaTimes, FaLock, FaCheck, FaShieldAlt, FaPlus, FaTrash, FaUnlock
} from 'react-icons/fa';
import PageHeader from '../../components/ui/PageHeader';

const DEFAULT_ROLES_PERMISOS = {
  Administrador: {
    ventas: { ver: true, crear: true, editar: true, eliminar: true },
    inventario: { ver: true, crear: true, editar: true, eliminar: true },
    lotes: { ver: true, crear: true, editar: true, eliminar: true },
    tbf: { ver: true, crear: true, editar: true, eliminar: true },
    graficos: { ver: true, crear: true, editar: true, eliminar: true },
    empresa: { ver: true, crear: true, editar: true, eliminar: true },
    promociones: { ver: true, crear: true, editar: true, eliminar: true },
    caja: { ver: true, crear: true, editar: true, eliminar: true },
    calendario_global: { ver: true, crear: true, editar: true, eliminar: true },
    calendario_sucursal: { ver: true, crear: true, editar: true, eliminar: true },
  },
  Vendedor: {
    ventas: { ver: true, crear: true, editar: false, eliminar: false },
    inventario: { ver: true, crear: false, editar: false, eliminar: false },
    lotes: { ver: false, crear: false, editar: false, eliminar: false },
    tbf: { ver: true, crear: true, editar: false, eliminar: false },
    graficos: { ver: false, crear: false, editar: false, eliminar: false },
    empresa: { ver: false, crear: false, editar: false, eliminar: false },
    promociones: { ver: true, crear: false, editar: false, eliminar: false },
    caja: { ver: true, crear: true, editar: true, eliminar: true },
    calendario_global: { ver: true, crear: false, editar: false, eliminar: false },
    calendario_sucursal: { ver: true, crear: true, editar: true, eliminar: false },
  },
  Cajero: {
    ventas: { ver: true, crear: true, editar: false, eliminar: false },
    inventario: { ver: true, crear: false, editar: false, eliminar: false },
    lotes: { ver: false, crear: false, editar: false, eliminar: false },
    tbf: { ver: true, crear: true, editar: true, eliminar: false },
    graficos: { ver: true, crear: false, editar: false, eliminar: false },
    empresa: { ver: false, crear: false, editar: false, eliminar: false },
    promociones: { ver: true, crear: false, editar: false, eliminar: false },
    caja: { ver: true, crear: true, editar: true, eliminar: true },
    calendario_global: { ver: true, crear: false, editar: false, eliminar: false },
    calendario_sucursal: { ver: true, crear: false, editar: false, eliminar: false },
  },
  Almacenero: {
    ventas: { ver: false, crear: false, editar: false, eliminar: false },
    inventario: { ver: true, crear: true, editar: true, eliminar: false },
    lotes: { ver: true, crear: true, editar: true, eliminar: true },
    tbf: { ver: false, crear: false, editar: false, eliminar: false },
    graficos: { ver: false, crear: false, editar: false, eliminar: false },
    empresa: { ver: false, crear: false, editar: false, eliminar: false },
    promociones: { ver: false, crear: false, editar: false, eliminar: false },
    caja: { ver: false, crear: false, editar: false, eliminar: false },
    calendario_global: { ver: true, crear: false, editar: false, eliminar: false },
    calendario_sucursal: { ver: true, crear: false, editar: false, eliminar: false },
  },
};

const MODULE_LABELS = {
  ventas: 'Ventas y Facturación',
  inventario: 'Inventario de Productos',
  lotes: 'Gestión de Lotes',
  tbf: 'TBF (Tickets, Boletas y Facturas)',
  graficos: 'Módulo de Reportes / Gráficos',
  empresa: 'Configuración de Empresa / Roles',
  promociones: 'Promociones / Descuentos',
  caja: 'Gestión de Caja / Turnos',
  calendario_global: '📅 Calendario Global (Eventos Empresa)',
  calendario_sucursal: '🏬 Calendario de Sucursal',
};

const PERMISSION_LABELS = {
  ver: 'Ver / Listar',
  crear: 'Crear / Registrar',
  editar: 'Editar / Modificar',
  eliminar: 'Anular / Eliminar',
};

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
          Ingresa tu contraseña para aplicar los cambios de seguridad.
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

const CreateRoleModal = ({ isOpen, onClose, onCreate, existingRoles, theme, ds }) => {
  const [roleName, setRoleName] = useState('');
  const [copyFrom, setCopyFrom] = useState('');
  const [perms, setPerms] = useState(() => {
    const initial = {};
    Object.keys(MODULE_LABELS).forEach(moduleKey => {
      initial[moduleKey] = { ver: false, crear: false, editar: false, eliminar: false };
    });
    return initial;
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (copyFrom && copyFrom !== 'none') {
      const source = existingRoles[copyFrom];
      if (source) {
        const copied = {};
        Object.keys(MODULE_LABELS).forEach(moduleKey => {
          copied[moduleKey] = { ...source[moduleKey] };
        });
        setPerms(copied);
      }
    } else if (copyFrom === 'none') {
      const reset = {};
      Object.keys(MODULE_LABELS).forEach(moduleKey => {
        reset[moduleKey] = { ver: false, crear: false, editar: false, eliminar: false };
      });
      setPerms(reset);
    }
  }, [copyFrom, existingRoles]);

  const handleLocalToggle = (moduleKey, permKey) => {
    setPerms(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [permKey]: !prev[moduleKey][permKey]
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = roleName.trim();
    if (!name) {
      setError('El nombre del rol es obligatorio.');
      return;
    }
    const exists = Object.keys(existingRoles).some(
      r => r.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      setError('Ya existe un rol con este nombre.');
      return;
    }
    if (name.length > 25) {
      setError('El nombre del rol no debe exceder 25 caracteres.');
      return;
    }
    onCreate(name, perms);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl p-6 flex flex-col gap-4 ${ds.cardBg} border max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center border-b pb-3 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold">Crear Nuevo Rol</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <FaTimes size={16} />
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-xl">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase">Nombre del Rol</label>
              <input
                type="text"
                value={roleName}
                onChange={e => { setRoleName(e.target.value); setError(''); }}
                placeholder="ej. Supervisor, Auditor"
                autoFocus
                maxLength={25}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${ds.inputCls}`}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase">Copiar Permisos de (Opcional)</label>
              <select
                value={copyFrom}
                onChange={e => setCopyFrom(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${ds.inputCls}`}
              >
                <option value="none">Ninguno (Vacío)</option>
                {Object.keys(existingRoles).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <label className="text-xs font-semibold text-gray-400 uppercase">Configurar Permisos Específicos</label>
            <div className="flex flex-col gap-2.5 max-h-[40vh] overflow-y-auto pr-1">
              {Object.keys(MODULE_LABELS).map(moduleKey => (
                <div key={moduleKey} className={`p-3 rounded-xl border ${ds.cardFlat} flex flex-col gap-2`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs text-yellow-500">{MODULE_LABELS[moduleKey]}</span>
                    <span className="text-[9px] font-mono text-gray-400">{moduleKey}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.keys(PERMISSION_LABELS).map(permKey => {
                      const isChecked = perms[moduleKey][permKey];
                      return (
                        <label key={permKey} className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleLocalToggle(moduleKey, permKey)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                          />
                          <span className={isChecked ? ds.text : ds.muted}>{PERMISSION_LABELS[permKey]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 border-t pt-4 mt-2 border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border font-semibold transition-colors text-sm
                ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-colors text-sm">
              Crear Rol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RolesPer = () => {
  const ds = useDS();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMaster = user?.role === 'Master';

  const loadWithDefaults = (saved) => {
    // Merge saved perms with defaults so every role always has all module keys
    const base = saved || DEFAULT_ROLES_PERMISOS;
    const merged = {};
    Object.keys(base).forEach(role => {
      const defaultPerms = DEFAULT_ROLES_PERMISOS[role] || {};
      const savedPerms   = base[role] || {};
      merged[role] = {};
      Object.keys(MODULE_LABELS).forEach(mk => {
        merged[role][mk] = { ...{ ver: false, crear: false, editar: false, eliminar: false }, ...defaultPerms[mk], ...savedPerms[mk] };
      });
    });
    return merged;
  };

  const [rolesPermisos, setRolesPermisos] = useState(() => {
    const saved = localStorage.getItem('ersoft_roles_permisos');
    return loadWithDefaults(saved ? JSON.parse(saved) : null);
  });

  const [selectedRole, setSelectedRole] = useState('Administrador');
  const [showPassword, setShowPassword] = useState(false);
  const [tempPermisos, setTempPermisos] = useState(rolesPermisos);
  const [hasChanges, setHasChanges] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'save' } | { type: 'create', name, perms } | { type: 'delete', name }

  useEffect(() => {
    setTempPermisos(rolesPermisos);
    setHasChanges(false);
  }, [rolesPermisos]);

  const handleToggle = (moduleKey, permKey) => {
    // Only Master can edit the Administrador role
    if (selectedRole === 'Administrador' && !isMaster) return;

    setTempPermisos(prev => {
      const currentModulePerms = prev[selectedRole]?.[moduleKey] || { ver: false, crear: false, editar: false, eliminar: false };
      const updated = {
        ...prev,
        [selectedRole]: {
          ...prev[selectedRole],
          [moduleKey]: {
            ...currentModulePerms,
            [permKey]: !currentModulePerms[permKey],
          }
        }
      };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(rolesPermisos));
      return updated;
    });
  };

  const handleSave = () => {
    setPendingAction({ type: 'save' });
    setShowPassword(true);
  };

  const handleCreateRole = (name, perms) => {
    setPendingAction({ type: 'create', name, perms });
    setShowPassword(true);
  };

  const handleDeleteRoleClick = (roleName) => {
    if (['Administrador', 'Vendedor', 'Cajero', 'Almacenero'].includes(roleName)) {
      alert('Los roles del sistema por defecto no pueden ser eliminados.');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el rol "${roleName}"?`)) {
      setPendingAction({ type: 'delete', name: roleName });
      setShowPassword(true);
    }
  };

  const handlePasswordConfirmed = () => {
    setShowPassword(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'save') {
      setRolesPermisos(tempPermisos);
      localStorage.setItem('ersoft_roles_permisos', JSON.stringify(tempPermisos));
      setHasChanges(false);
    } else if (pendingAction.type === 'create') {
      const updated = {
        ...rolesPermisos,
        [pendingAction.name]: pendingAction.perms
      };
      setRolesPermisos(updated);
      localStorage.setItem('ersoft_roles_permisos', JSON.stringify(updated));
      setSelectedRole(pendingAction.name);
      setShowCreateModal(false);
      setHasChanges(false);
    } else if (pendingAction.type === 'delete') {
      const updated = { ...rolesPermisos };
      delete updated[pendingAction.name];
      setRolesPermisos(updated);
      localStorage.setItem('ersoft_roles_permisos', JSON.stringify(updated));
      setSelectedRole('Administrador');
      setHasChanges(false);
    }
    setPendingAction(null);
  };

  // Administrador is only fully locked for non-Master users
  const isAdminLocked = selectedRole === 'Administrador' && !isMaster;
  const isDefaultRole = ['Administrador', 'Vendedor', 'Cajero', 'Almacenero'].includes(selectedRole);

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>
      <PageHeader
        backLabel="Volver al menú"
        onBack={() => navigate('/principal')}
        right={
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-colors border border-gray-700"
            >
              <FaPlus size={10} /> Crear Rol
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors animate-pulse"
              >
                <FaSave size={13} /> Guardar Permisos
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 flex flex-col gap-6 px-10 py-6 max-w-7xl mx-auto w-full pb-10 overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white">
          <div className="flex items-center gap-2">
            <FaUserShield className="text-yellow-500" />
            <h2 className="font-bold text-base uppercase tracking-wider">Roles y Permisos del Sistema</h2>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Roles Side Rows List */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
            <h3 className={`text-[10px] uppercase tracking-wider font-bold ${ds.muted} mb-1`}>Seleccionar Rol</h3>
            <div className="flex flex-col gap-2 max-h-[50vh] md:max-h-none overflow-y-auto pr-1">
              {Object.keys(rolesPermisos).map(role => {
                const isSelected = selectedRole === role;
                const isSystem = ['Administrador', 'Vendedor', 'Cajero', 'Almacenero'].includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-between group
                      ${isSelected
                        ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/10'
                        : theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span>{role}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider transition-colors
                      ${isSelected
                        ? 'bg-black/20 text-black'
                        : isSystem
                          ? 'bg-gray-500/10 text-gray-400 dark:text-gray-500 group-hover:text-gray-300'
                          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {isSystem ? 'Sist' : 'Pers'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions Grid */}
          <div className={`flex-1 rounded-2xl border p-6 ${ds.cardBg} w-full`}>
            <div className="flex justify-between items-start mb-6 gap-4">
              <div>
                <h3 className={`text-lg font-bold ${ds.text}`}>Permisos para {selectedRole}</h3>
                <p className={`text-xs ${ds.muted}`}>
                  {isAdminLocked
                    ? 'El rol de Administrador tiene acceso total. Solo el Master puede modificar sus permisos.'
                    : selectedRole === 'Administrador' && isMaster
                    ? 'Como Master puedes ajustar los permisos del Administrador. Los cambios requieren confirmación de contraseña.'
                    : 'Habilita o deshabilita los permisos correspondientes de acceso a cada módulo.'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isDefaultRole && (
                  <button
                    onClick={() => handleDeleteRoleClick(selectedRole)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-500 transition-colors border border-red-500/20"
                    title="Eliminar este Rol"
                  >
                    <FaTrash size={10} /> Eliminar Rol
                  </button>
                )}
                {isAdminLocked && (
                  <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                    <FaLock size={10} /> Solo Master
                  </span>
                )}
                {selectedRole === 'Administrador' && isMaster && (
                  <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <FaUnlock size={10} /> Editable (Master)
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {Object.keys(MODULE_LABELS).map(moduleKey => (
                <div
                  key={moduleKey}
                  className={`p-4 rounded-xl border ${ds.cardFlat} flex flex-col lg:flex-row lg:items-center justify-between gap-4`}
                >
                  <div className="shrink-0">
                    <h4 className={`font-semibold text-sm ${ds.text}`}>{MODULE_LABELS[moduleKey]}</h4>
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{moduleKey}</span>
                  </div>

                  <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-6">
                    {Object.keys(PERMISSION_LABELS).map(permKey => {
                      const isChecked = tempPermisos[selectedRole]?.[moduleKey]?.[permKey] ?? false;
                      const isDisabled = isAdminLocked;

                      return (
                        <label
                          key={permKey}
                          className={`flex items-center gap-2 text-xs font-medium cursor-pointer select-none transition-colors
                            ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
                            ${isChecked ? ds.text : ds.muted}
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => handleToggle(moduleKey, permKey)}
                            className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <span>{PERMISSION_LABELS[permKey]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPassword && (
        <PasswordModal
          onConfirm={handlePasswordConfirmed}
          onCancel={() => { setShowPassword(false); setPendingAction(null); }}
          theme={theme}
          ds={ds}
        />
      )}

      {showCreateModal && (
        <CreateRoleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRole}
          existingRoles={rolesPermisos}
          theme={theme}
          ds={ds}
        />
      )}
    </div>
  );
};

export default RolesPer;
