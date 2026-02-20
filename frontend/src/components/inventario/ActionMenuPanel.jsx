import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { FaTimes, FaBoxOpen, FaTags, FaLayerGroup, FaFileImport } from 'react-icons/fa';

const ACTIONS = [
  { label: 'Agregar Producto o Servicio', icon: FaBoxOpen, key: 'add' },
  { label: 'Crear Categorías', icon: FaTags, key: 'categorias' },
  { label: 'Crear Lotes', icon: FaLayerGroup, key: 'lotes' },
  { label: 'Importar dataset (MASIVO)', icon: FaFileImport, key: 'importar', disabled: true },
];

const ActionMenuPanel = ({ onClose, onSelect, activeTab }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const btnCls = theme === 'dark'
    ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-white'
    : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-900';

  const handleSelect = (key) => {
    if (key === 'lotes') { onClose(); navigate('/lotes'); return; }
    onSelect(key);
  };

  return (
    <div className={`h-full flex flex-col justify-center px-6 gap-4 ${bg}`}>
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-400"><FaTimes /></button>
      {ACTIONS.map(action => (
        <button
          key={action.key}
          onClick={() => !action.disabled && handleSelect(action.key)}
          disabled={action.disabled}
          className={`flex items-center justify-center gap-3 border-2 rounded-2xl py-5 px-4 font-bold text-base italic
            transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
            ${btnCls}`}
        >
          <action.icon size={20} />
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default ActionMenuPanel;
