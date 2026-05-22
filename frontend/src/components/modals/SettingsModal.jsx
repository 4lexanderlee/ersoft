import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEmpresa } from '../../context/EmpresaContext';

const SettingsModal = ({ onClose }) => {
  const { logout } = useAuth();
  const { empresa } = useEmpresa();
  const navigate = useNavigate();
  const ref = useRef(null);

  const [showSubmenu, setShowSubmenu] = useState(false);

  // Submenu items under Empresa configuration
  const submenuItems = [
    { label: 'Datos Generales y Ubi', path: '/empresa/datos-ubi' },
    { label: 'Serie y Correlativos', path: '/empresa/series-co' },
    { label: 'Sucursales', path: '/empresa/sucursales' },
    { label: 'Roles y Permisos', path: '/empresa/roles-per' },
    { label: 'Usuarios', path: '/empresa/usuarios' },
    { label: 'Metodos de pago', path: '/empresa/metodos-pago' },
  ];

  // Other menu items (Guía, Soporte, Salir)
  const menuItems = [
    { label: 'Guía User', action: null },
    { label: 'Soporte', action: null },
    { label: 'Salir', action: 'logout' },
  ];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleItem = (item) => {
    if (item.action === 'logout') {
      logout();
      navigate('/login');
    }
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-12 left-12 w-56 bg-white rounded-2xl shadow-2xl py-2 z-50"
    >
      {/* Empresa Button (wraps hover submenu) */}
      <div
        className="relative"
        onMouseEnter={() => setShowSubmenu(true)}
        onMouseLeave={() => setShowSubmenu(false)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSubmenu(!showSubmenu);
          }}
          className="w-full text-left px-5 py-3 text-sm transition-colors hover:bg-gray-100 truncate font-semibold border-b border-gray-100 text-gray-800 flex justify-between items-center"
          title={empresa.razonSocial || 'R&E'}
        >
          <span>{empresa.razonSocial || 'R&E'}</span>
          <span className="text-gray-400 text-xs transition-transform duration-200">▸</span>
        </button>

        {showSubmenu && (
          <div className="absolute left-[calc(100%+8px)] top-0 w-60 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 animate-in fade-in slide-in-from-left-2 duration-150">
            {submenuItems.map((sub) => (
              <button
                key={sub.label}
                onClick={() => {
                  navigate(sub.path);
                  onClose();
                }}
                className="w-full text-left px-5 py-2.5 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors font-medium truncate"
                title={sub.label}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {menuItems.map((item) => (
        <button
          key={item.label}
          onClick={() => handleItem(item)}
          className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-gray-100 truncate
            ${item.action === 'logout' ? 'text-red-500 font-semibold' : 'text-gray-800'}
          `}
          title={item.label}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default SettingsModal;
