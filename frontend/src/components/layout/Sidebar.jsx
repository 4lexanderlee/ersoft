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
  { label: 'CAL', path: '/calendario' },
];

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full text-center py-3 text-sm font-bold tracking-wider transition-colors
                  ${isActive
                    ? 'text-yellow-400 border-l-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {item.label}
              </Link>
            );
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
