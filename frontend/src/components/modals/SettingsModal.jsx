import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEmpresa } from '../../context/EmpresaContext';

const SettingsModal = ({ onClose }) => {
  const { logout } = useAuth();
  const { empresa } = useEmpresa();
  const navigate = useNavigate();
  const ref = useRef(null);

  // Dynamic menu: first item label = company name (R&E placeholder)
  const menuItems = [
    { label: empresa.razonSocial || 'R&E', action: 'empresa' },
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
    } else if (item.action === 'empresa') {
      navigate('/empresa');
    }
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-12 left-12 w-56 bg-white rounded-2xl shadow-2xl py-2 z-50"
    >
      {menuItems.map((item) => (
        <button
          key={item.label}
          onClick={() => handleItem(item)}
          className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-gray-100 truncate
            ${item.action === 'logout' ? 'text-red-500 font-semibold' : 'text-gray-800'}
            ${item.action === 'empresa' ? 'font-semibold border-b border-gray-100' : ''}
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
