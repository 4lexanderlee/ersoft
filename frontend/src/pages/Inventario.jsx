import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useInventario } from '../context/InventarioContext';
import { FaArrowLeft, FaPlus, FaEllipsisV, FaImage } from 'react-icons/fa';
import { MdTune } from 'react-icons/md';

// Panels
import ActionMenuPanel from '../components/inventario/ActionMenuPanel';
import AddProductPanel from '../components/inventario/AddProductPanel';
import AddServicioPanel from '../components/inventario/AddServicioPanel';
import AddCategoriasPanel from '../components/inventario/AddCategoriasPanel';

/* ─── Product Card ─────────────────────────────────────────────── */
const ProductCard = ({ item, onEdit, onDelete, theme }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900';
  const menuBg = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 relative ${cardBg}`}>
      {/* 3-dot menu */}
      <div ref={menuRef} className="absolute top-3 right-3">
        <button onClick={() => setMenuOpen(!menuOpen)}
          className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaEllipsisV size={14} />
        </button>
        {menuOpen && (
          <div className={`absolute right-0 top-8 w-32 rounded-xl border shadow-xl z-20 py-1 ${menuBg}`}>
            <button onClick={() => { setMenuOpen(false); onEdit(); }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-blue-500/10 text-blue-500 transition-colors`}>
              ✏️ Editar
            </button>
            <button onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-red-500/10 text-red-500 transition-colors">
              🗑️ Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Name */}
      <p className={`text-xs font-bold uppercase tracking-wide pr-8 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
        {item.nombre}
      </p>

      {/* Image */}
      <div className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden
        ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        {item.imagen
          ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain" />
          : <FaImage size={36} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'} />}
      </div>

      {/* Price & Stock */}
      <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        Precio: S/. {parseFloat(item.precio || 0).toFixed(2)}
      </p>
      <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        Stock: {item.stock ?? 'N/A'}
      </p>
      {item.categoria && (
        <span className={`text-xs text-center px-2 py-0.5 rounded-full self-center ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
          {item.categoria}
        </span>
      )}
    </div>
  );
};

/* ─── Servicio Card ─────────────────────────────────────────────── */
const ServicioCard = ({ item, onEdit, onDelete, theme }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900';
  const menuBg = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 relative ${cardBg}`}>
      <div ref={menuRef} className="absolute top-3 right-3">
        <button onClick={() => setMenuOpen(!menuOpen)} className={`p-1.5 rounded-lg hover:bg-black/10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaEllipsisV size={14} />
        </button>
        {menuOpen && (
          <div className={`absolute right-0 top-8 w-32 rounded-xl border shadow-xl z-20 py-1 ${menuBg}`}>
            <button onClick={() => { setMenuOpen(false); onEdit(); }} className="w-full text-left px-4 py-2 text-sm text-blue-500 hover:bg-blue-500/10">✏️ Editar</button>
            <button onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">🗑️ Eliminar</button>
          </div>
        )}
      </div>
      <p className={`text-xs font-bold uppercase tracking-wide pr-8 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{item.nombre}</p>
      {item.imagen
        ? <img src={item.imagen} alt={item.nombre} className="w-full aspect-square rounded-xl object-contain" />
        : <div className={`w-full aspect-square rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FaImage size={36} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'} />
          </div>}
      <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Precio: S/. {parseFloat(item.precio || 0).toFixed(2)}</p>
      {item.descripcion && <p className={`text-xs text-center line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{item.descripcion}</p>}
    </div>
  );
};

/* ─── Filter Panel ──────────────────────────────────────────────── */
const FilterPanel = ({ onClose, sortBy, setSortBy, selectedCats, setSelectedCats, categorias, theme }) => {
  const panelRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const bg = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800';
  const sorts = [
    { label: 'Todos', val: '' },
    { label: 'A - Z', val: 'az' },
    { label: 'Z - A', val: 'za' },
    { label: 'S/. Mayor - Menor', val: 'priceDsc' },
    { label: 'S/. Menor - Mayor', val: 'priceAsc' },
    { label: 'Stock mayor - menor', val: 'stockDsc' },
    { label: 'Stock menor - mayor', val: 'stockAsc' },
  ];
  const toggleCat = (cat) => setSelectedCats(prev =>
    prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
  );

  return (
    <div ref={panelRef} className={`absolute top-full right-0 mt-1 w-56 rounded-2xl border shadow-2xl z-30 p-4 ${bg}`}>
      <div className="space-y-1">
        {sorts.map(s => (
          <label key={s.val} className="flex items-center justify-between py-1 cursor-pointer">
            <span className="text-sm">{s.label}</span>
            <input type="radio" name="sort" checked={sortBy === s.val} onChange={() => setSortBy(s.val)}
              className="accent-yellow-500" />
          </label>
        ))}
      </div>
      {categorias.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center justify-between font-semibold text-sm mb-2">
            Categorías
            <input type="checkbox" checked={selectedCats.length === 0}
              onChange={() => setSelectedCats([])} className="accent-yellow-500" />
          </label>
          {categorias.map(cat => (
            <label key={cat} className="flex items-center justify-between py-0.5 cursor-pointer">
              <span className={`text-xs ml-2 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>{cat}</span>
              <input type="checkbox" checked={selectedCats.includes(cat)}
                onChange={() => toggleCat(cat)} className="accent-yellow-500" />
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main Inventario Page ──────────────────────────────────────── */
const Inventario = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { productos, deleteProducto, servicios, deleteServicio, loteActivo, categorias } = useInventario();

  const [activeTab, setActiveTab] = useState('productos'); // 'productos' | 'servicios'
  const [panel, setPanel] = useState(null);   // null | 'menu' | 'add' | 'addServicio' | 'cats' | editProduct | editServicio
  const [editItem, setEditItem] = useState(null);
  const [editMode, setEditMode] = useState(null); // 'producto' | 'servicio'

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [selectedCats, setSelectedCats] = useState([]);

  const [noLoteAlert, setNoLoteAlert] = useState(false);

  const pageBg = theme === 'dark' ? 'bg-[#313b48]' : 'bg-[#d6d0d4]';
  const headerBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-[#e8e3e8] border-gray-200';
  const tabBarBg = 'bg-[#1a1a1a]';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';

  const handlePlusClick = () => {
    setPanel('menu');
    setEditItem(null);
    setEditMode(null);
  };

  const handleMenuSelect = (key) => {
    if (key === 'add') {
      if (!loteActivo) { setNoLoteAlert(true); setPanel(null); return; }
      setPanel(activeTab === 'productos' ? 'add' : 'addServicio');
    } else if (key === 'categorias') {
      setPanel('cats');
    }
  };

  const applyFilters = (items) => {
    let arr = [...items];
    if (selectedCats.length > 0) arr = arr.filter(i => selectedCats.includes(i.categoria));
    if (sortBy === 'az') arr.sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (sortBy === 'za') arr.sort((a, b) => b.nombre.localeCompare(a.nombre));
    if (sortBy === 'priceDsc') arr.sort((a, b) => b.precio - a.precio);
    if (sortBy === 'priceAsc') arr.sort((a, b) => a.precio - b.precio);
    if (sortBy === 'stockDsc') arr.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    if (sortBy === 'stockAsc') arr.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    return arr;
  };

  const filteredProductos = applyFilters(productos);
  const filteredServicios = applyFilters(servicios);

  const isPanelOpen = panel !== null;

  const panelContent = () => {
    if (panel === 'menu') return <ActionMenuPanel onClose={() => setPanel(null)} onSelect={handleMenuSelect} activeTab={activeTab} />;
    if (panel === 'add') return <AddProductPanel onClose={() => setPanel(null)} editItem={editItem} />;
    if (panel === 'addServicio') return <AddServicioPanel onClose={() => setPanel(null)} editItem={editItem} />;
    if (panel === 'cats') return <AddCategoriasPanel onClose={() => setPanel(null)} />;
    return null;
  };

  return (
    <div className={`flex flex-col min-h-full -m-6 relative overflow-hidden ${pageBg}`}>

      {/* Header */}
      <div className={`flex items-center justify-between px-8 py-4 border-b z-10 ${headerBg}`}>
        <button onClick={() => navigate('/principal')} className={`flex items-center gap-2 font-bold text-lg hover:opacity-70 ${text}`}>
          <FaArrowLeft /> Volver al menú
        </button>
        <div className="flex items-center gap-3">
          <span className={`font-medium ${text}`}>Master</span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all ${isPanelOpen ? 'w-1/2' : 'w-full'}`}>

          {/* Tab Bar */}
          <div className={`flex items-center ${tabBarBg}`}>
            <button
              onClick={() => setActiveTab('productos')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors relative
                ${activeTab === 'productos' ? 'text-white underline underline-offset-4' : 'text-gray-400 hover:text-gray-200'}`}>
              Productos
            </button>
            <button
              onClick={() => setActiveTab('servicios')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors
                ${activeTab === 'servicios' ? 'text-white underline underline-offset-4' : 'text-gray-400 hover:text-gray-200'}`}>
              Servicios
            </button>
            <div className="relative px-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-white hover:text-yellow-400 transition-colors"
                title="Filtros">
                <MdTune size={22} />
              </button>
              {showFilters && (
                <FilterPanel
                  onClose={() => setShowFilters(false)}
                  sortBy={sortBy} setSortBy={setSortBy}
                  selectedCats={selectedCats} setSelectedCats={setSelectedCats}
                  categorias={activeTab === 'productos' ? categorias.productos : categorias.servicios}
                  theme={theme}
                />
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'productos' && (
              filteredProductos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <p className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No hay productos aún. Presiona <strong>+</strong> para agregar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProductos.map(p => (
                    <ProductCard key={p.id} item={p} theme={theme}
                      onEdit={() => { setEditItem(p); setPanel('add'); }}
                      onDelete={() => deleteProducto(p.id)} />
                  ))}
                </div>
              )
            )}
            {activeTab === 'servicios' && (
              filteredServicios.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <p className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No hay servicios aún. Presiona <strong>+</strong> para agregar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredServicios.map(s => (
                    <ServicioCard key={s.id} item={s} theme={theme}
                      onEdit={() => { setEditItem(s); setPanel('addServicio'); }}
                      onDelete={() => deleteServicio(s.id)} />
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          <div className="py-2 text-center text-xs text-gray-400 bg-black">®Todos los derechos reservados. ERSOFT</div>
        </div>

        {/* Right Slide Panel */}
        <div className={`transition-all duration-300 overflow-hidden relative ${isPanelOpen ? 'w-1/2 border-l border-gray-300' : 'w-0'}`}
          style={{ borderColor: theme === 'dark' ? '#374151' : '#d1d5db' }}>
          {isPanelOpen && panelContent()}
        </div>
      </div>

      {/* Floating + button — hidden when side panel is open */}
      {!isPanelOpen && (
        <button
          onClick={handlePlusClick}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#1a1a1a] hover:bg-gray-700 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40"
        >
          <FaPlus size={22} />
        </button>
      )}

      {/* No lote alert */}
      {noLoteAlert && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl p-7 flex flex-col gap-4 text-center shadow-2xl ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="text-4xl">⚠</div>
            <h3 className="font-bold text-lg">Sin lote activo</h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No puedes agregar productos sin un lote activo. Crea un lote primero desde la sección <strong>Crear Lotes</strong>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setNoLoteAlert(false)}
                className={`flex-1 py-2 rounded-xl border font-semibold text-sm ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                Cerrar
              </button>
              <button onClick={() => { setNoLoteAlert(false); navigate('/lotes'); }}
                className="flex-1 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm">
                Ir a Lotes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
