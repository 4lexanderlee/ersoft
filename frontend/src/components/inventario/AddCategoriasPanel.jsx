import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useInventario } from '../../context/InventarioContext';
import { FaTimes, FaPlus, FaMinus } from 'react-icons/fa';

/* ─── CategoryList extracted to module level ────────────────────────
   CRITICAL: must NOT be defined inside AddCategoriasPanel or React
   will remount it each render causing the input to lose focus.        */
const CategoryList = ({ tipo, items, newVal, setNew, onAdd, onRemove, theme }) => {
  const itemBg = theme === 'dark'
    ? 'bg-gray-800 border-gray-700 text-gray-200'
    : 'bg-gray-50 border-gray-200 text-gray-700';
  const inputCls = theme === 'dark'
    ? 'text-white placeholder-gray-500'
    : 'text-gray-700 placeholder-gray-400';
  const borderCls = theme === 'dark' ? 'border-gray-600' : 'border-gray-300';

  return (
    <div className="space-y-2">
      {items.map(cat => (
        <div key={cat}
          className={`flex items-center justify-between px-4 py-2 border rounded-full ${itemBg}`}>
          <span className="text-sm font-medium">{cat}</span>
          <button
            onClick={() => onRemove(tipo, cat)}
            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors flex-shrink-0">
            <FaMinus size={10} />
          </button>
        </div>
      ))}

      {/* Add new input */}
      <div className={`flex items-center gap-2 border rounded-full px-3 py-1.5 ${borderCls}`}>
        <input
          value={newVal}
          onChange={e => setNew(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          placeholder="Agregar categoría"
          className={`flex-1 bg-transparent text-sm outline-none ${inputCls}`}
        />
        <button
          onClick={onAdd}
          className="w-7 h-7 rounded-full bg-yellow-500 hover:bg-yellow-400 flex items-center justify-center flex-shrink-0">
          <FaPlus size={11} className="text-black" />
        </button>
      </div>
    </div>
  );
};

/* ─── AddCategoriasPanel ─────────────────────────────────────────── */
const AddCategoriasPanel = ({ onClose }) => {
  const { theme } = useTheme();
  const { categorias, addCategoria, removeCategoria } = useInventario();
  const [newProd, setNewProd] = useState('');
  const [newServ, setNewServ] = useState('');

  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const borderCls = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  const handleAddProd = () => {
    if (!newProd.trim()) return;
    addCategoria('productos', newProd.trim());
    setNewProd('');
  };
  const handleAddServ = () => {
    if (!newServ.trim()) return;
    addCategoria('servicios', newServ.trim());
    setNewServ('');
  };

  return (
    <div className={`h-full flex flex-col ${bg}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${borderCls}`}>
        <h2 className={`font-bold text-base italic ${text}`}>Agregar Categorías</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-red-400"><FaTimes /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Productos */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${text}`}>Categorías de Productos</h3>
          <div className={`p-3 border rounded-2xl ${borderCls}`}>
            <CategoryList
              tipo="productos"
              items={categorias.productos}
              newVal={newProd}
              setNew={setNewProd}
              onAdd={handleAddProd}
              onRemove={removeCategoria}
              theme={theme}
            />
          </div>
        </div>

        {/* Servicios */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${text}`}>Categorías de Servicios</h3>
          <div className={`p-3 border rounded-2xl ${borderCls}`}>
            <CategoryList
              tipo="servicios"
              items={categorias.servicios}
              newVal={newServ}
              setNew={setNewServ}
              onAdd={handleAddServ}
              onRemove={removeCategoria}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCategoriasPanel;
