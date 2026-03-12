import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useInventario } from '../context/InventarioContext';
import { useDS } from '../hooks/useDS';
import { FaPlus, FaEllipsisV, FaImage, FaBoxOpen, FaSearch } from 'react-icons/fa';
import { MdTune } from 'react-icons/md';
import PageHeader from '../components/ui/PageHeader';
import Btn from '../components/ui/Btn';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';

// Panels
import ActionMenuPanel from '../components/inventario/ActionMenuPanel';
import AddProductPanel from '../components/inventario/AddProductPanel';
import AddServicioPanel from '../components/inventario/AddServicioPanel';
import AddCategoriasPanel from '../components/inventario/AddCategoriasPanel';
import ImportDatasetPanel from '../components/inventario/ImportDatasetPanel';

/* ─── Helpers ───────────────────────────────────────────────────── */
/** Normalise categorias field: supports both legacy string and new array */
const getCats = (item) => {
  if (Array.isArray(item?.categorias)) return item.categorias;
  if (item?.categoria) return [item.categoria];
  return [];
};

/* ─── Auth Delete Modal ─────────────────────────────────────────── */
const AuthDeleteModal = ({ theme, ds, onConfirm, onCancel, label = 'este elemento' }) => {
  const { login, user } = useAuth();
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const inputCls = theme === 'dark'
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400';

  const handleConfirm = () => {
    const r = login(user.username, pwd);
    if (!r.success) { setErr('Contraseña incorrecta'); return; }
    onConfirm();
  };

  return (
    <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
      <Card variant="raised" className="w-full max-w-sm flex flex-col gap-4 text-center">
        <div>
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🗑️</span>
          </div>
          <h3 className={`font-bold text-lg ${ds.text}`}>Eliminar</h3>
          <p className={`text-sm mt-1 ${ds.muted}`}>Confirma con tu contraseña master para eliminar <strong>{label}</strong>.</p>
        </div>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setErr(''); }}
          placeholder="Contraseña master" autoFocus
          className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 ${inputCls}`} />
        <div className="flex gap-3">
          <Btn variant="secondary" fullWidth onClick={onCancel}>Cancelar</Btn>
          <Btn variant="danger" fullWidth onClick={handleConfirm}>Eliminar</Btn>
        </div>
      </Card>
    </div>
  );
};

/* ─── Category Chips ────────────────────────────────────────────── */
const CatChips = ({ item, ds }) => {
  const cats = getCats(item);
  if (cats.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {cats.map(cat => (
        <span key={cat} className={`text-xs px-2 py-0.5 rounded-full ${ds.isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
          {cat}
        </span>
      ))}
    </div>
  );
};

/* ─── Product Card ─────────────────────────────────────────────── */
const ProductCard = ({ item, onEdit, onDelete, theme }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const ds = useDS();

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <Card className="flex flex-col gap-2 relative" padding="sm">
      {/* 3-dot menu */}
      <div ref={menuRef} className="absolute top-2 right-2 z-10">
        <button onClick={() => setMenuOpen(!menuOpen)}
          className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${ds.iconColor}`}>
          <FaEllipsisV size={13} />
        </button>
        {menuOpen && (
          <div className={`absolute right-0 top-8 w-32 rounded-xl border shadow-xl z-20 py-1 ${ds.dropBg}`}>
            <button onClick={() => { setMenuOpen(false); onEdit(); }}
              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-blue-500/10 text-blue-500 transition-colors">
              ✏️ Editar
            </button>
            <button onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-red-500/10 text-red-500 transition-colors">
              🗑️ Eliminar
            </button>
          </div>
        )}
      </div>

      <p className={`text-xs font-bold uppercase tracking-wide pr-8 ${ds.text}`}>{item.nombre}</p>

      <div className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden
        ${ds.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        {item.imagen
          ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain" />
          : <FaImage size={36} className={ds.subtle} />}
      </div>

      <p className={`text-sm text-center ${ds.muted}`}>S/. {parseFloat(item.precio || 0).toFixed(2)}</p>
      <p className={`text-xs text-center font-semibold ${
        (item.stock ?? 0) <= 0 ? 'text-red-400' : (item.stock ?? 0) <= 5 ? 'text-amber-400' : 'text-green-400'
      }`}>Stock: {item.stock ?? 'N/A'}</p>
      <CatChips item={item} ds={ds} />
    </Card>
  );
};

/* ─── Servicio Card ─────────────────────────────────────────────── */
const ServicioCard = ({ item, onEdit, onDelete, theme }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const ds = useDS();
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <Card className="flex flex-col gap-2 relative" padding="sm">
      <div ref={menuRef} className="absolute top-2 right-2 z-10">
        <button onClick={() => setMenuOpen(!menuOpen)} className={`p-1.5 rounded-lg hover:bg-black/10 ${ds.iconColor}`}>
          <FaEllipsisV size={13} />
        </button>
        {menuOpen && (
          <div className={`absolute right-0 top-8 w-32 rounded-xl border shadow-xl z-20 py-1 ${ds.dropBg}`}>
            <button onClick={() => { setMenuOpen(false); onEdit(); }} className="w-full text-left px-4 py-2 text-sm text-blue-500 hover:bg-blue-500/10">✏️ Editar</button>
            <button onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">🗑️ Eliminar</button>
          </div>
        )}
      </div>
      <p className={`text-xs font-bold uppercase tracking-wide pr-8 ${ds.text}`}>{item.nombre}</p>
      {item.imagen
        ? <img src={item.imagen} alt={item.nombre} className="w-full aspect-square rounded-xl object-contain" />
        : <div className={`w-full aspect-square rounded-xl flex items-center justify-center ${ds.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FaImage size={36} className={ds.subtle} />
          </div>}
      <p className={`text-sm text-center ${ds.muted}`}>S/. {parseFloat(item.precio || 0).toFixed(2)}</p>
      {item.descripcion && <p className={`text-xs text-center line-clamp-2 ${ds.subtle}`}>{item.descripcion}</p>}
      <CatChips item={item} ds={ds} />
    </Card>
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
  const ds = useDS();
  const { productos, deleteProducto, servicios, deleteServicio, loteActivo, categorias } = useInventario();

  const [activeTab, setActiveTab] = useState('productos');
  const [panel, setPanel] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [selectedCats, setSelectedCats] = useState([]);
  const [searchText, setSearchText] = useState('');

  const [noLoteAlert, setNoLoteAlert] = useState(false);

  // Auth-delete state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'producto'|'servicio', id, nombre }

  const tabBarBg = 'bg-[#1a1a1a]';

  const handlePlusClick = () => { setPanel('menu'); setEditItem(null); };

  const handleMenuSelect = (key) => {
    if (key === 'add') {
      if (!loteActivo) { setNoLoteAlert(true); setPanel(null); return; }
      setPanel(activeTab === 'productos' ? 'add' : 'addServicio');
    } else if (key === 'categorias') {
      setPanel('cats');
    } else if (key === 'importar') {
      setPanel('importar');
    }
  };

  const applyFilters = (items) => {
    let arr = [...items];
    // Search filter: name or barcode
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      arr = arr.filter(i =>
        i.nombre.toLowerCase().includes(q) ||
        (i.codigoBarras && String(i.codigoBarras).toLowerCase().includes(q))
      );
    }
    if (selectedCats.length > 0) {
      arr = arr.filter(i => {
        const cats = getCats(i);
        return cats.some(c => selectedCats.includes(c));
      });
    }
    if (sortBy === 'az') arr.sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (sortBy === 'za') arr.sort((a, b) => b.nombre.localeCompare(a.nombre));
    if (sortBy === 'priceDsc') arr.sort((a, b) => b.precio - a.precio);
    if (sortBy === 'priceAsc') arr.sort((a, b) => a.precio - b.precio);
    if (sortBy === 'stockDsc') arr.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    if (sortBy === 'stockAsc') arr.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    return arr;
  };

  // Gather all unique category names for the filter panel
  const allProductCats = [...new Set(productos.flatMap(p => getCats(p)))];
  const allServicioCats = [...new Set(servicios.flatMap(s => getCats(s)))];

  const filteredProductos = applyFilters(productos);
  const filteredServicios = applyFilters(servicios);

  const isPanelOpen = panel !== null;

  const panelContent = () => {
    if (panel === 'menu') return <ActionMenuPanel onClose={() => setPanel(null)} onSelect={handleMenuSelect} activeTab={activeTab} />;
    if (panel === 'add') return <AddProductPanel onClose={() => setPanel(null)} editItem={editItem} />;
    if (panel === 'addServicio') return <AddServicioPanel onClose={() => setPanel(null)} editItem={editItem} />;
    if (panel === 'cats') return <AddCategoriasPanel onClose={() => setPanel(null)} />;
    if (panel === 'importar') return <ImportDatasetPanel onClose={() => setPanel(null)} />;
    return null;
  };

  return (
    <div className={`flex flex-col flex-1 -m-6 relative overflow-hidden ${ds.pageBg}`}>

      {/* Header */}
      <PageHeader onBack={() => navigate('/principal')} />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all ${isPanelOpen ? 'w-1/2' : 'w-full'}`}>

          {/* Tab Bar */}
          <div className={`flex items-center ${tabBarBg}`}>
            <button
              onClick={() => { setActiveTab('productos'); setSearchText(''); }}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors relative
                ${activeTab === 'productos' ? 'text-white underline underline-offset-4' : 'text-gray-400 hover:text-gray-200'}`}>
              Productos
            </button>
            <button
              onClick={() => { setActiveTab('servicios'); setSearchText(''); }}
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
                  categorias={activeTab === 'productos' ? allProductCats : allServicioCats}
                  theme={theme}
                />
              )}
            </div>
          </div>

          {/* Search bar — context-aware per active tab */}
          <div className={`flex items-center gap-2 px-5 py-3 border-b ${
            ds.isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white/60 border-gray-200'
          }`}>
            <FaSearch size={13} className={ds.subtle} />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder={activeTab === 'productos'
                ? 'Buscar producto por nombre o código de barras...'
                : 'Buscar servicio por nombre...'}
              className={`flex-1 bg-transparent outline-none text-sm ${
                ds.isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              }`}
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  ds.isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                }`}>
                ✕
              </button>
            )}
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'productos' && (
              filteredProductos.length === 0 ? (
                <EmptyState icon={<FaBoxOpen />} title="Sin productos" message="No hay productos aún. Presiona + para agregar." />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProductos.map(p => (
                    <ProductCard key={p.id} item={p} theme={theme}
                      onEdit={() => { setEditItem(p); setPanel('add'); }}
                      onDelete={() => setDeleteTarget({ type: 'producto', id: p.id, nombre: p.nombre })} />
                  ))}
                </div>
              )
            )}
            {activeTab === 'servicios' && (
              filteredServicios.length === 0 ? (
                <EmptyState icon={<FaBoxOpen />} title="Sin servicios" message="No hay servicios aún. Presiona + para agregar." />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredServicios.map(s => (
                    <ServicioCard key={s.id} item={s} theme={theme}
                      onEdit={() => { setEditItem(s); setPanel('addServicio'); }}
                      onDelete={() => setDeleteTarget({ type: 'servicio', id: s.id, nombre: s.nombre })} />
                  ))}
                </div>
              )
            )}
          </div>

        </div>

        {/* Right Slide Panel */}
        <div className={`transition-all duration-300 overflow-hidden relative h-full ${isPanelOpen ? 'w-1/2 border-l border-gray-300' : 'w-0'}`}
          style={{ borderColor: theme === 'dark' ? '#374151' : '#d1d5db' }}>
          {isPanelOpen && <div className="h-full">{panelContent()}</div>}
        </div>
      </div>

      {/* Floating + button */}
      {!isPanelOpen && (
        <button
          onClick={handlePlusClick}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#1a1a1a] hover:bg-yellow-500 hover:text-black text-white shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 z-40"
        >
          <FaPlus size={22} />
        </button>
      )}

      {/* No lote alert */}
      {noLoteAlert && (
        <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
          <Card variant="raised" className="w-full max-w-sm flex flex-col gap-4 text-center">
            <div className="text-4xl">⚠</div>
            <h3 className={`font-bold text-lg ${ds.text}`}>Sin lote activo</h3>
            <p className={`text-sm ${ds.muted}`}>
              No puedes agregar productos sin un lote activo. Crea un lote primero desde <strong>Crear Lotes</strong>.
            </p>
            <div className="flex gap-3">
              <Btn variant="secondary" fullWidth onClick={() => setNoLoteAlert(false)}>Cerrar</Btn>
              <Btn variant="primary" fullWidth onClick={() => { setNoLoteAlert(false); navigate('/lotes'); }}
                className="bg-yellow-500! text-black! hover:bg-yellow-400!">
                Ir a Lotes
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Auth Delete Modal */}
      {deleteTarget && (
        <AuthDeleteModal
          theme={theme}
          ds={ds}
          label={deleteTarget.nombre}
          onConfirm={() => {
            if (deleteTarget.type === 'producto') deleteProducto(deleteTarget.id);
            else deleteServicio(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Inventario;
