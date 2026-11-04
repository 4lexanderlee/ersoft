import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUserCircle, FaCog } from 'react-icons/fa';
import { usePermission } from '../../hooks/usePermission';
import SettingsModal from '../modals/SettingsModal';

const NAV_ITEMS = [
  { label: 'INI', path: '/principal' },
  { label: 'GRF', path: '/graficos', module: 'graficos_rendimiento' },
  { label: 'VEN', path: '/ventas', module: 'ventas_caja' },
  { label: 'TBF', path: '/tbf', module: 'tbf' },
  { label: 'INV', path: '/inventario', module: 'inventario' },
  { label: 'PR%', path: '/promociones', module: 'ventas_caja' },
  { label: 'REN', path: '/rendiciones', module: 'rendiciones_cxc_cxp' },
  { label: 'CRM', path: '/crm', module: 'crm' },
  { label: 'CAL', path: '/calendario', module: 'calendario' },
];

const Sidebar = () => {
  const location = useLocation();
  const { can } = usePermission();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cajaOpen, setCajaOpen] = useState(false);
  const hasCajaPermission = () => can('ventas_caja', 'VER');
  const filteredItems = NAV_ITEMS.filter(item => !item.module || can(item.module, 'VER'));

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
