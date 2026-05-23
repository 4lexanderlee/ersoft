import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUserCircle, FaCog } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import SettingsModal from '../modals/SettingsModal';

const NAV_ITEMS = [
  { label: 'INI', path: '/principal' },
  { label: 'GRF', path: '/graficos' },
  { label: 'VEN', path: '/ventas' },
  { label: 'TBF', path: '/tbf' },
  { label: 'INV', path: '/inventario' },
  { label: 'PR%', path: '/promociones' },
  { label: 'CAL', path: '/calendario' },
];

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

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cajaOpen, setCajaOpen] = useState(false);

  const hasCajaPermission = () => {
    if (!user) return false;
    if (user.role === 'Master') return true;
    try {
      const saved = localStorage.getItem('ersoft_roles_permisos');
      const rolesPermisos = saved ? JSON.parse(saved) : DEFAULT_ROLES_PERMISOS;
      const rolePerm = rolesPermisos[user.role];
      return !!(rolePerm && (rolePerm.caja?.ver || rolePerm.ventas?.ver));
    } catch (e) {
      return false;
    }
  };

  const getFilteredNavItems = () => {
    if (!user) return [];
    if (user.role === 'Master') return NAV_ITEMS;
    
    try {
      const saved = localStorage.getItem('ersoft_roles_permisos');
      const savedRoles = saved ? JSON.parse(saved) : {};
      // Merge: saved role permissions take priority, but fall back to DEFAULT for missing keys
      const defaultRolePerm = DEFAULT_ROLES_PERMISOS[user.role] || {};
      const savedRolePerm   = savedRoles[user.role] || {};
      // Deep-merge: saved overrides default, so new module keys always have a default
      const rolePerm = {};
      Object.keys(defaultRolePerm).forEach(mk => {
        rolePerm[mk] = { ...defaultRolePerm[mk], ...(savedRolePerm[mk] || {}) };
      });
      // Also include any extra modules in saved that aren't in default
      Object.keys(savedRolePerm).forEach(mk => {
        if (!rolePerm[mk]) rolePerm[mk] = { ...savedRolePerm[mk] };
      });

      if (Object.keys(rolePerm).length === 0) return [NAV_ITEMS[0]];
      
      return NAV_ITEMS.filter(item => {
        if (item.path === '/principal') return true;
        const keyMap = {
          '/graficos':    'graficos',
          '/ventas':      'ventas',
          '/tbf':         'tbf',
          '/inventario':  'inventario',
          '/promociones': 'promociones',
          '/calendario':  'calendario_global',
        };
        const moduleKey = keyMap[item.path];
        if (!moduleKey) return true;
        // If the key doesn't exist at all (unknown future module), show it by default
        return rolePerm[moduleKey] ? rolePerm[moduleKey].ver : true;
      });
    } catch (e) {
      console.error('Error filtering nav items:', e);
      return [NAV_ITEMS[0]];
    }
  };


  const filteredItems = getFilteredNavItems();

  return (
    <>
      <div className="flex flex-col w-20 min-h-screen bg-[#1a1a1a] items-center py-4 relative z-30">
        {/* User avatar → navigates to profile */}
        <Link
          to="/perfil"
          className="mb-6 mt-2 text-gray-300 hover:text-white transition-colors"
          title="Ver perfil"
        >
          <FaUserCircle size={36} />
        </Link>
 
        {/* Navigation items */}
        <nav className="flex flex-col gap-1 flex-1 w-full items-center">
          {filteredItems.flatMap((item) => {
            const isActive = location.pathname === item.path;
            const elements = [
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (item.path === '/ventas') {
                    setCajaOpen(prev => !prev);
                  }
                }}
                onContextMenu={(e) => {
                  if (item.path === '/ventas') {
                    e.preventDefault();
                    setCajaOpen(prev => !prev);
                  }
                }}
                className={`w-full text-center py-3 text-sm font-bold tracking-wider transition-colors
                  ${isActive
                    ? 'text-yellow-400 border-l-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {item.label}
              </Link>
            ];

            if (item.path === '/ventas' && cajaOpen && hasCajaPermission()) {
              const isCajaActive = location.pathname === '/caja';
              elements.push(
                <Link
                  key="/caja"
                  to="/caja"
                  className={`w-full text-center py-3 text-sm font-bold tracking-wider transition-colors
                    ${isCajaActive
                      ? 'text-yellow-400 border-l-2 border-yellow-400'
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  CAJA
                </Link>
              );
            }

            return elements;
          })}
        </nav>

        {/* Settings gear at bottom */}
        <div className="mb-4 relative">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <FaCog size={22} />
          </button>

          {/* Settings popup (positioned above gear) */}
          {settingsOpen && (
            <SettingsModal onClose={() => setSettingsOpen(false)} />
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
