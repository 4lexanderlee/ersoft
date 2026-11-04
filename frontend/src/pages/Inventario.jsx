import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useInventario } from '../context/InventarioContext';
import { useDS } from '../hooks/useDS';
import {
  FaPlus,
  FaEllipsisV,
  FaImage,
  FaBoxOpen,
  FaSearch,
  FaCheckSquare,
  FaTrash,
  FaTh,
  FaLayerGroup,
  FaFolder,
  FaFolderOpen,
  FaChevronRight,
  FaChevronDown,
  FaPencilAlt,
  FaCheck,
  FaTimes,
  FaTag,
} from 'react-icons/fa';
import { MdTune } from 'react-icons/md';
import PageHeader from '../components/ui/PageHeader';
import Btn from '../components/ui/Btn';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import RefreshButton from '../components/ui/RefreshButton';

// Panels
import ActionMenuPanel from '../components/inventario/ActionMenuPanel';
import AddProductPanel from '../components/inventario/AddProductPanel';
import AddServicioPanel from '../components/inventario/AddServicioPanel';
import AddCategoriasPanel from '../components/inventario/AddCategoriasPanel';
import ImportDatasetPanel from '../components/inventario/ImportDatasetPanel';
import AlmacenesPanel from '../components/inventario/AlmacenesPanel';

const PAGE_SIZE = 25;

/* ─── Helpers ───────────────────────────────────────────────────── */
const getCats = (item) => {
  if (Array.isArray(item?.categorias)) return item.categorias;
  if (item?.categoria) return [item.categoria];
  return [];
};

/* ─── Auth Delete Modal ─────────────────────────────────────────── */
const AuthDeleteModal = ({ theme, ds, onConfirm, onCancel, label = 'este elemento' }) => {
  const { verifyPassword } = useAuth();
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const inputCls = theme === 'dark'
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400';

  const handleConfirm = () => {
    if (!verifyPassword(pwd)) { setErr('Contraseña incorrecta'); return; }
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
          <p className={`text-sm mt-1 ${ds.muted}`}>Confirma con tu contraseña para eliminar <strong>{label}</strong>.</p>
        </div>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <input
          type="password"
          value={pwd}
          onChange={e => { setPwd(e.target.value); setErr(''); }}
          placeholder="Contraseña"
          autoFocus
          className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 ${inputCls}`}
        />
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

/* ─── Variants Modal (Inspect Variant Stock) ─────────────────────── */
const VariantsInspectionModal = ({ product, onClose, theme, ds }) => {
  if (!product) return null;
  const variantes = product.variantes || [];

  return (
    <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] ${theme === 'dark' ? 'bg-gray-900 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-850' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-2">
            <FaTh className="text-yellow-500" size={16} />
            <div>
              <h3 className="font-bold text-base">{product.nombre}</h3>
              <p className="text-xs text-gray-500">
                Matriz de {variantes.length} Variantes | Stock total: {product.stock} {product.unidadMedida || 'NIU'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400 p-1">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full text-xs">
            <thead className={theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}>
              <tr>
                <th className="py-2 px-3 text-left">Talla</th>
                <th className="py-2 px-3 text-left">Color</th>
                <th className="py-2 px-3 text-left">SKU Hijo</th>
                <th className="py-2 px-3 text-left">Cód. Barras</th>
                <th className="py-2 px-3 text-right">Precio Venta</th>
                <th className="py-2 px-3 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {variantes.map(v => (
                <tr key={v.id} className={`border-t ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-800/40' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <td className="py-2 px-3 font-bold">{v.talla}</td>
                  <td className="py-2 px-3">{v.color}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-gray-500">{v.sku}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-gray-500">{v.barcode}</td>
                  <td className="py-2 px-3 text-right font-semibold">S/. {parseFloat(v.precio || product.precio || 0).toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-bold text-green-500">
                    {v.stock} {product.unidadMedida || 'unid'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <Btn variant="secondary" size="sm" onClick={onClose}>Cerrar</Btn>
        </div>
      </div>
    </div>
  );
};

/* ─── Product Card ─────────────────────────────────────────────── */
const ProductCard = ({ item, onEdit, onDelete, onInspectVariants, selectMode, isSelected, toggleSelect }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const ds = useDS();
  const hasVariants = item.variantes && item.variantes.length > 0;
  const isDecimal = item.permite_decimales;

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <Card
      className={`flex flex-col gap-2 relative transition-all cursor-${selectMode ? 'pointer' : 'default'} ${
        selectMode && isSelected ? 'ring-2 ring-yellow-500/70 border-yellow-500/50' : 'hover:border-yellow-500/30'
      }`}
      padding="sm"
      onClick={selectMode ? () => toggleSelect(item.id) : undefined}
    >
      {/* Checkbox in selection mode */}
      {selectMode && (
        <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          isSelected
            ? 'bg-yellow-500 border-yellow-500'
            : ds.isDark ? 'border-gray-500 bg-gray-800' : 'border-gray-400 bg-white'
        }`}>
          {isSelected && <span className="text-black text-xs font-bold">✓</span>}
        </div>
      )}

      {/* 3-dot menu */}
      {!selectMode && (
        <div ref={menuRef} className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${ds.iconColor}`}
          >
            <FaEllipsisV size={13} />
          </button>
          {menuOpen && (
            <div className={`absolute right-0 top-8 w-32 rounded-xl border shadow-xl z-20 py-1 ${ds.dropBg}`}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-blue-500/10 text-blue-500 transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-red-500/10 text-red-500 transition-colors"
              >
                🗑️ Eliminar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header tags: Demanda (ventas) + UM */}
      <div className="flex items-center justify-between pr-7 gap-1">
        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
          🔥 {item.ventas_acumuladas || 0} vtas
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
          ds.isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}>
          {item.unidadMedida || 'NIU'}
        </span>
      </div>

      <p className={`text-xs font-bold uppercase tracking-wide truncate ${ds.text}`} title={item.nombre}>
        {item.nombre}
      </p>

      {/* Image */}
      <div className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden ${
        ds.isDark ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        {item.imagen ? (
          <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain" />
        ) : (
          <FaImage size={36} className={ds.subtle} />
        )}
      </div>

      {/* Price & Stock */}
      <p className={`text-sm text-center font-bold ${ds.muted}`}>
        S/. {parseFloat(item.precio || 0).toFixed(2)}
      </p>

      <p className={`text-xs text-center font-semibold ${
        (item.stock ?? 0) <= 0 ? 'text-red-400' : (item.stock ?? 0) <= 5 ? 'text-amber-400' : 'text-green-400'
      }`}>
        Stock: {isDecimal ? parseFloat(item.stock || 0).toFixed(3) : (item.stock ?? 'N/A')} {item.unidadMedida || ''}
      </p>

      {/* Variant badge and inspector toggle */}
      {hasVariants && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onInspectVariants(item); }}
          className="w-full py-1 px-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
        >
          <FaTh size={10} /> {item.variantes.length} Variantes ▼
        </button>
      )}

      <CatChips item={item} ds={ds} />
    </Card>
  );
};

/* ─── Servicio Card ─────────────────────────────────────────────── */
const ServicioCard = ({ item, onEdit, onDelete, selectMode, isSelected, toggleSelect }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const ds = useDS();

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <Card
      className={`flex flex-col gap-2 relative transition-all cursor-${selectMode ? 'pointer' : 'default'} ${
        selectMode && isSelected ? 'ring-2 ring-yellow-500/70 border-yellow-500/50' : 'hover:border-yellow-500/30'
      }`}
      padding="sm"
      onClick={selectMode ? () => toggleSelect(item.id) : undefined}
    >
      {/* Checkbox in selection mode */}
      {selectMode && (
        <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          isSelected
            ? 'bg-yellow-500 border-yellow-500'
            : ds.isDark ? 'border-gray-500 bg-gray-800' : 'border-gray-400 bg-white'
        }`}>
          {isSelected && <span className="text-black text-xs font-bold">✓</span>}
        </div>
      )}

      {/* 3-dot menu */}
      {!selectMode && (
        <div ref={menuRef} className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className={`p-1.5 rounded-lg hover:bg-black/10 ${ds.iconColor}`}
          >
            <FaEllipsisV size={13} />
          </button>
          {menuOpen && (
            <div className={`absolute right-0 top-8 w-32 rounded-xl border shadow-xl z-20 py-1 ${ds.dropBg}`}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                className="w-full text-left px-4 py-2 text-sm text-blue-500 hover:bg-blue-500/10"
              >
                ✏️ Editar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
              >
                🗑️ Eliminar
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pr-7">
        <span className="text-[10px] font-bold text-amber-500">
          🔥 {item.ventas_acumuladas || 0} vtas
        </span>
        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
          SERVICIO
        </span>
      </div>

      <p className={`text-xs font-bold uppercase tracking-wide truncate ${ds.text}`}>{item.nombre}</p>

      {item.imagen ? (
        <img src={item.imagen} alt={item.nombre} className="w-full aspect-square rounded-xl object-contain" />
      ) : (
        <div className={`w-full aspect-square rounded-xl flex items-center justify-center ${ds.isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <FaImage size={36} className={ds.subtle} />
        </div>
      )}

      <p className={`text-sm text-center font-bold ${ds.muted}`}>S/. {parseFloat(item.precio || 0).toFixed(2)}</p>
      {item.descripcion && <p className={`text-xs text-center line-clamp-2 ${ds.subtle}`}>{item.descripcion}</p>}
      <CatChips item={item} ds={ds} />
    </Card>
  );
};

/* ─── Pagination Component ──────────────────────────────────────── */
const PaginationControls = ({ currentPage, totalItems, pageSize, onPageChange, ds }) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex items-center justify-between px-5 py-3 border-t ${ds.divider} flex-wrap gap-2`}>
      <span className={`text-xs ${ds.muted}`}>
        Mostrando <strong className={ds.text}>{startItem}-{endItem}</strong> de <strong className={ds.text}>{totalItems}</strong> registros
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <Btn
            variant="secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            ‹ Anterior
          </Btn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
            if (totalPages > 6 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
              return null;
            }
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                  currentPage === p
                    ? 'bg-yellow-500 text-black shadow-xs'
                    : `${ds.iconColor} hover:bg-gray-200 dark:hover:bg-gray-800`
                }`}
              >
                {p}
              </button>
            );
          })}
          <Btn
            variant="secondary"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Siguiente ›
          </Btn>
        </div>
      )}
    </div>
  );
};

/* ─── Filter Panel ──────────────────────────────────────────────── */
const FilterPanel = ({
  onClose,
  sortBy,
  setSortBy,
  selectedCats,
  setSelectedCats,
  categorias,
  theme,
  activeTab,
  lotes,
  selectedLote,
  setSelectedLote,
  almacenes,
  selectedWarehouse,
  setSelectedWarehouse,
  user,
}) => {
  const panelRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const bg = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800';
  const sorts = [
    { label: 'Todos', val: '' },
    { label: '🔥 Demanda (Más Vendidos)', val: 'demanda' },
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

  const isMaster = user?.role === 'Master' || user?.rol === 'MASTER';
  const userSucursalId = user?.sucursalId || user?.sucursal_id || '1';
  const allowedAlmacenes = (almacenes || []).filter(w => isMaster || String(w.sucursalId) === String(userSucursalId));
  const allowedWarehouseIds = allowedAlmacenes.map(w => w.id);
  const filteredLotes = selectedWarehouse
    ? lotes.filter(l => l.almacenId === Number(selectedWarehouse))
    : lotes.filter(l => isMaster || allowedWarehouseIds.includes(l.almacenId));

  return (
    <div ref={panelRef} className={`absolute top-full right-0 mt-1 w-64 rounded-2xl border shadow-2xl z-30 p-4 ${bg}`}>
      <span className="block text-xs font-bold uppercase tracking-wider mb-2 text-yellow-500">
        Ordenar y Filtrar
      </span>
      <div className="space-y-1">
        {sorts.map(s => (
          <label key={s.val} className="flex items-center justify-between py-1 cursor-pointer">
            <span className="text-xs">{s.label}</span>
            <input
              type="radio"
              name="sort"
              checked={sortBy === s.val}
              onChange={() => setSortBy(s.val)}
              className="accent-yellow-500"
            />
          </label>
        ))}
      </div>

      {categorias.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center justify-between font-semibold text-xs mb-2">
            Categorías
            <input
              type="checkbox"
              checked={selectedCats.length === 0}
              onChange={() => setSelectedCats([])}
              className="accent-yellow-500"
            />
          </label>
          <div className="max-h-36 overflow-y-auto space-y-0.5">
            {categorias.map(cat => (
              <label key={cat} className="flex items-center justify-between py-0.5 cursor-pointer">
                <span className={`text-xs ml-2 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>{cat}</span>
                <input
                  type="checkbox"
                  checked={selectedCats.includes(cat)}
                  onChange={() => toggleCat(cat)}
                  className="accent-yellow-500"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'productos' && allowedAlmacenes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center justify-between font-semibold text-xs mb-1.5">
            Almacén
          </label>
          <select
            value={selectedWarehouse}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : '';
              setSelectedWarehouse(val);
              setSelectedLote('');
            }}
            className={`w-full text-xs px-2 py-1.5 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} outline-none`}
          >
            <option value="">Todos los almacenes</option>
            {allowedAlmacenes.map(w => (
              <option key={w.id} value={w.id}>{w.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {activeTab === 'productos' && filteredLotes && filteredLotes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center justify-between font-semibold text-xs mb-1.5">
            Lote
          </label>
          <select
            value={selectedLote}
            onChange={(e) => setSelectedLote(Number(e.target.value) || '')}
            className={`w-full text-xs px-2 py-1.5 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} outline-none`}
          >
            <option value="">Todos los lotes</option>
            {filteredLotes.map(l => (
              <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

/* ─── Dedicated Hierarchical Tree View Component ─────────────────── */
const TreeViewModule = ({
  arbolCategorias,
  productos,
  onFilterByBranch,
  addFamilia,
  updateFamilia,
  deleteFamilia,
  addCategoriaNode,
  updateCategoriaNode,
  deleteCategoriaNode,
  addSubcategoriaNode,
  updateSubcategoriaNode,
  deleteSubcategoriaNode,
  theme,
  ds,
}) => {
  const [collapsedFamilias, setCollapsedFamilias] = useState({});
  const [collapsedCategorias, setCollapsedCategorias] = useState({});

  // Inputs
  const [newFamName, setNewFamName] = useState('');
  const [addingCatFamId, setAddingCatFamId] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [addingSubcatId, setAddingSubcatId] = useState(null);
  const [newSubcatName, setNewSubcatName] = useState('');

  // Editing node
  const [editingNode, setEditingNode] = useState(null);

  const toggleFam = (id) => setCollapsedFamilias(p => ({ ...p, [id]: !p[id] }));
  const toggleCat = (id) => setCollapsedCategorias(p => ({ ...p, [id]: !p[id] }));

  // Helper to count SKUs per branch
  const getFamSkuCount = (fam) => {
    return productos.filter(p =>
      p.familia === fam.nombre ||
      (fam.categorias || []).some(c => c.nombre === p.categoria || (p.categorias || []).includes(c.nombre))
    ).length;
  };

  const getCatSkuCount = (cat) => {
    return productos.filter(p =>
      p.categoria === cat.nombre || (p.categorias || []).includes(cat.nombre)
    ).length;
  };

  const getSubSkuCount = (sub) => {
    return productos.filter(p => p.subcategoria === sub.nombre).length;
  };

  const handleAddFam = (e) => {
    e.preventDefault();
    if (!newFamName.trim()) return;
    addFamilia(newFamName.trim());
    setNewFamName('');
  };

  const handleAddCat = (famId) => {
    if (!newCatName.trim()) return;
    addCategoriaNode(famId, newCatName.trim());
    setNewCatName('');
    setAddingCatFamId(null);
    setCollapsedFamilias(p => ({ ...p, [famId]: false }));
  };

  const handleAddSub = (famId, catId) => {
    if (!newSubcatName.trim()) return;
    addSubcategoriaNode(famId, catId, newSubcatName.trim());
    setNewSubcatName('');
    setAddingSubcatId(null);
    setCollapsedCategorias(p => ({ ...p, [catId]: false }));
  };

  const handleSaveEdit = () => {
    if (!editingNode || !editingNode.name.trim()) return;
    if (editingNode.type === 'fam') updateFamilia(editingNode.id, editingNode.name.trim());
    else if (editingNode.type === 'cat') updateCategoriaNode(editingNode.famId, editingNode.id, editingNode.name.trim());
    else if (editingNode.type === 'sub') updateSubcategoriaNode(editingNode.famId, editingNode.catId, editingNode.id, editingNode.name.trim());
    setEditingNode(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Top Banner & Creator */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
        theme === 'dark' ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
            <FaLayerGroup size={20} />
          </div>
          <div>
            <h3 className={`font-bold text-base ${ds.text}`}>Árbol Maestro de Familias y Categorías</h3>
            <p className={`text-xs ${ds.muted}`}>
              Estructura jerárquica de 3 niveles con conteo dinámico de SKUs activos y gestión completa.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddFam} className="flex gap-2 w-full sm:w-auto">
          <input
            value={newFamName}
            onChange={e => setNewFamName(e.target.value)}
            placeholder="Nueva Familia..."
            className={`px-3 py-2 text-xs rounded-xl border outline-none ${ds.inputCls} min-w-[200px]`}
          />
          <Btn type="submit" size="sm" variant="primary" className="bg-yellow-500! text-black! hover:bg-yellow-400! shrink-0">
            + Familia
          </Btn>
        </form>
      </div>

      {/* Tree Nodes */}
      <div className="space-y-3">
        {arbolCategorias.map(fam => {
          const isCollapsed = collapsedFamilias[fam.id];
          const isEditingFam = editingNode?.type === 'fam' && editingNode.id === fam.id;
          const famCount = getFamSkuCount(fam);

          return (
            <div
              key={fam.id}
              className={`rounded-2xl border transition-all ${
                theme === 'dark' ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-white shadow-xs'
              }`}
            >
              {/* Level 1: Familia */}
              <div className="flex items-center justify-between p-3.5 gap-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleFam(fam.id)}
                    className="p-1 hover:text-yellow-500 transition-colors text-gray-400"
                  >
                    {isCollapsed ? <FaChevronRight size={13} /> : <FaChevronDown size={13} />}
                  </button>
                  {isCollapsed ? (
                    <FaFolder className="text-yellow-500 shrink-0" size={18} />
                  ) : (
                    <FaFolderOpen className="text-yellow-500 shrink-0" size={18} />
                  )}

                  {isEditingFam ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        autoFocus
                        value={editingNode.name}
                        onChange={e => setEditingNode({ ...editingNode, name: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); }}
                        className={`px-2 py-1 text-sm font-bold border rounded-lg outline-none ${ds.inputCls} flex-1`}
                      />
                      <button onClick={handleSaveEdit} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                        <FaCheck size={12} />
                      </button>
                      <button onClick={() => setEditingNode(null)} className="p-1.5 text-gray-400 hover:bg-gray-500/10 rounded-lg">
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className={`font-bold text-sm tracking-wide truncate ${ds.text}`}>{fam.nombre}</span>
                  )}

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                    {famCount} SKUs
                  </span>
                </div>

                {!isEditingFam && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onFilterByBranch(fam.nombre)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-yellow-500 hover:text-black dark:bg-gray-700 dark:hover:bg-yellow-500 text-gray-700 dark:text-gray-300 transition-colors"
                      title="Filtrar catálogo por esta familia"
                    >
                      Ver Ítems
                    </button>
                    <button
                      onClick={() => { setAddingCatFamId(fam.id); setNewCatName(''); }}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 transition-colors flex items-center gap-1"
                      title="Agregar categoría"
                    >
                      <FaPlus size={9} /> Cat
                    </button>
                    <button
                      onClick={() => setEditingNode({ type: 'fam', id: fam.id, name: fam.nombre })}
                      className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Editar nombre"
                    >
                      <FaPencilAlt size={12} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar la familia "${fam.nombre}" y todas sus categorías?`)) {
                          deleteFamilia(fam.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Eliminar familia"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Inline Add Category input */}
              {addingCatFamId === fam.id && (
                <div className={`mx-4 mb-2 p-2 rounded-xl border flex gap-2 ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-amber-50/60 border-amber-200'
                }`}>
                  <input
                    autoFocus
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddCat(fam.id); }}
                    placeholder="Nombre de la nueva categoría..."
                    className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none ${ds.inputCls}`}
                  />
                  <Btn size="sm" variant="primary" onClick={() => handleAddCat(fam.id)} className="bg-yellow-500! text-black!">
                    Guardar
                  </Btn>
                  <button onClick={() => setAddingCatFamId(null)} className="px-2 text-xs text-gray-400">
                    Cancelar
                  </button>
                </div>
              )}

              {/* Level 2: Categorías */}
              {!isCollapsed && (
                <div className="pl-6 pr-4 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                  {(fam.categorias || []).length === 0 ? (
                    <p className={`text-xs italic pl-4 py-1 ${ds.muted}`}>Sin categorías en esta familia.</p>
                  ) : (
                    fam.categorias.map(cat => {
                      const isCatCollapsed = collapsedCategorias[cat.id];
                      const isEditingCat = editingNode?.type === 'cat' && editingNode.id === cat.id;
                      const catCount = getCatSkuCount(cat);

                      return (
                        <div
                          key={cat.id}
                          className={`rounded-xl border ${
                            theme === 'dark' ? 'border-gray-700/60 bg-gray-900/40' : 'border-gray-200 bg-gray-50/70'
                          }`}
                        >
                          {/* Categoría Header */}
                          <div className="flex items-center justify-between p-2.5 gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <button
                                onClick={() => toggleCat(cat.id)}
                                className="p-1 hover:text-yellow-500 text-gray-400 transition-colors"
                              >
                                {isCatCollapsed ? <FaChevronRight size={10} /> : <FaChevronDown size={10} />}
                              </button>
                              <FaTag className="text-amber-500 shrink-0" size={13} />

                              {isEditingCat ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <input
                                    autoFocus
                                    value={editingNode.name}
                                    onChange={e => setEditingNode({ ...editingNode, name: e.target.value })}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); }}
                                    className={`px-2 py-0.5 text-xs font-semibold border rounded outline-none ${ds.inputCls} flex-1`}
                                  />
                                  <button onClick={handleSaveEdit} className="p-1 text-green-500"><FaCheck size={11} /></button>
                                  <button onClick={() => setEditingNode(null)} className="p-1 text-gray-400"><FaTimes size={11} /></button>
                                </div>
                              ) : (
                                <span className={`font-semibold text-xs truncate ${ds.text}`}>{cat.nombre}</span>
                              )}

                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">
                                {catCount} SKUs
                              </span>
                            </div>

                            {!isEditingCat && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => onFilterByBranch(cat.nombre)}
                                  className="px-2 py-0.5 text-[11px] font-semibold rounded bg-gray-200 hover:bg-yellow-500 hover:text-black dark:bg-gray-700 dark:hover:bg-yellow-500 text-gray-700 dark:text-gray-300 transition-colors"
                                  title="Filtrar catálogo"
                                >
                                  Ver
                                </button>
                                <button
                                  onClick={() => { setAddingSubcatId({ famId: fam.id, catId: cat.id }); setNewSubcatName(''); }}
                                  className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors flex items-center gap-1"
                                  title="Agregar subcategoría"
                                >
                                  <FaPlus size={8} /> Sub
                                </button>
                                <button
                                  onClick={() => setEditingNode({ type: 'cat', id: cat.id, famId: fam.id, name: cat.nombre })}
                                  className="p-1 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                                >
                                  <FaPencilAlt size={10} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) {
                                      deleteCategoriaNode(fam.id, cat.id);
                                    }
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                >
                                  <FaTrash size={10} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Inline Add Subcategory input */}
                          {addingSubcatId?.catId === cat.id && (
                            <div className={`mx-3 mb-2 p-2 rounded-lg border flex gap-2 ${
                              theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-amber-200'
                            }`}>
                              <input
                                autoFocus
                                value={newSubcatName}
                                onChange={e => setNewSubcatName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddSub(fam.id, cat.id); }}
                                placeholder="Nombre de subcategoría..."
                                className={`flex-1 px-2.5 py-1 text-xs rounded border outline-none ${ds.inputCls}`}
                              />
                              <Btn size="sm" variant="primary" onClick={() => handleAddSub(fam.id, cat.id)} className="bg-yellow-500! text-black!">
                                Guardar
                              </Btn>
                              <button onClick={() => setAddingSubcatId(null)} className="px-2 text-xs text-gray-400">
                                Cancelar
                              </button>
                            </div>
                          )}

                          {/* Level 3: Subcategorías */}
                          {!isCatCollapsed && (
                            <div className="pl-8 pr-2 pb-2 space-y-1">
                              {(cat.subcategorias || []).length === 0 ? (
                                <p className={`text-[11px] italic py-0.5 ${ds.muted}`}>Sin subcategorías.</p>
                              ) : (
                                cat.subcategorias.map(sub => {
                                  const isEditingSub = editingNode?.type === 'sub' && editingNode.id === sub.id;
                                  const subCount = getSubSkuCount(sub);

                                  return (
                                    <div
                                      key={sub.id}
                                      className={`flex items-center justify-between py-1 px-2 rounded-lg text-xs ${
                                        theme === 'dark' ? 'hover:bg-gray-800/60' : 'hover:bg-gray-100/80'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                                        {isEditingSub ? (
                                          <div className="flex items-center gap-1 flex-1">
                                            <input
                                              autoFocus
                                              value={editingNode.name}
                                              onChange={e => setEditingNode({ ...editingNode, name: e.target.value })}
                                              onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); }}
                                              className={`px-2 py-0.5 text-xs border rounded outline-none ${ds.inputCls} flex-1`}
                                            />
                                            <button onClick={handleSaveEdit} className="p-1 text-green-500"><FaCheck size={10} /></button>
                                            <button onClick={() => setEditingNode(null)} className="p-1 text-gray-400"><FaTimes size={10} /></button>
                                          </div>
                                        ) : (
                                          <span className={`truncate ${ds.text}`}>{sub.nombre}</span>
                                        )}
                                        <span className="text-[10px] text-gray-400">({subCount} SKUs)</span>
                                      </div>

                                      {!isEditingSub && (
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => onFilterByBranch(sub.nombre)}
                                            className="px-2 py-0.5 text-[10px] rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-500 hover:text-black transition-colors"
                                          >
                                            Ver
                                          </button>
                                          <button
                                            onClick={() => setEditingNode({ type: 'sub', id: sub.id, famId: fam.id, catId: cat.id, name: sub.nombre })}
                                            className="p-1 text-blue-500 hover:bg-blue-500/10 rounded"
                                          >
                                            <FaPencilAlt size={9} />
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (window.confirm(`¿Eliminar la subcategoría "${sub.nombre}"?`)) {
                                                deleteSubcategoriaNode(fam.id, cat.id, sub.id);
                                              }
                                            }}
                                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                          >
                                            <FaTrash size={9} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Main Inventario Page ──────────────────────────────────────── */
const Inventario = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const ds = useDS();
  const { verifyPassword, user } = useAuth();
  const {
    productos,
    deleteProducto,
    servicios,
    deleteServicio,
    loteActivo,
    categorias,
    arbolCategorias = [],
    addFamilia,
    updateFamilia,
    deleteFamilia,
    addCategoriaNode,
    updateCategoriaNode,
    deleteCategoriaNode,
    addSubcategoriaNode,
    updateSubcategoriaNode,
    deleteSubcategoriaNode,
    lotes,
    almacenes,
    refreshData,
  } = useInventario();

  const isMaster = user?.role === 'Master' || user?.rol === 'MASTER';
  const userSucursalId = user?.sucursalId || user?.sucursal_id || '1';

  const allowedWarehouseIds = (almacenes || [])
    .filter(w => isMaster || String(w.sucursalId) === String(userSucursalId))
    .map(w => w.id);
  const allowedLoteIds = (lotes || [])
    .filter(l => isMaster || allowedWarehouseIds.includes(l.almacenId))
    .map(l => l.id);

  const myProductos = productos.filter(p => isMaster || allowedLoteIds.includes(p.loteId));
  const myServicios = servicios.filter(s => isMaster || String(s.sucursalId) === String(userSucursalId));

  // Active navigation tab: 'productos' | 'arbol' | 'servicios'
  const [activeTab, setActiveTab] = useState('productos');
  const [panel, setPanel] = useState(null);
  const [editItem, setEditItem] = useState(null);

  // Pagination state (strict 25 per page)
  const [currentPage, setCurrentPage] = useState(1);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [selectedCats, setSelectedCats] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedLote, setSelectedLote] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  const [noLoteAlert, setNoLoteAlert] = useState(false);

  // Variant inspection modal state
  const [inspectingProduct, setInspectingProduct] = useState(null);

  // Auth-delete state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Bulk selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPwd, setBulkPwd] = useState('');
  const [bulkPwdError, setBulkPwdError] = useState('');

  const tabBarBg = 'bg-[#1a1a1a]';

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchText, selectedCats, sortBy, selectedLote, selectedWarehouse]);

  const handlePlusClick = () => { setPanel('menu'); setEditItem(null); };

  const handleMenuSelect = (key) => {
    if (key === 'add') {
      if (!loteActivo) { setNoLoteAlert(true); setPanel(null); return; }
      setPanel(activeTab === 'servicios' ? 'addServicio' : 'add');
    } else if (key === 'categorias') {
      setPanel('cats');
    } else if (key === 'importar') {
      setPanel('importar');
    } else if (key === 'almacenes') {
      setPanel('almacenes');
    }
  };

  const applyFilters = (items) => {
    let arr = [...items];
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      arr = arr.filter(i =>
        i.nombre.toLowerCase().includes(q) ||
        (i.codigoBarras && String(i.codigoBarras).toLowerCase().includes(q)) ||
        (i.sku && String(i.sku).toLowerCase().includes(q)) ||
        (i.familia && i.familia.toLowerCase().includes(q)) ||
        (i.categoria && i.categoria.toLowerCase().includes(q))
      );
    }
    if (selectedCats.length > 0) {
      arr = arr.filter(i => {
        const cats = getCats(i);
        return cats.some(c => selectedCats.includes(c)) ||
          selectedCats.includes(i.familia) ||
          selectedCats.includes(i.categoria) ||
          selectedCats.includes(i.subcategoria);
      });
    }
    if (selectedLote && activeTab === 'productos') {
      arr = arr.filter(i => i.loteId === selectedLote);
    }
    if (selectedWarehouse && activeTab === 'productos') {
      arr = arr.filter(i => {
        const lote = lotes.find(l => l.id === i.loteId);
        return lote && lote.almacenId === Number(selectedWarehouse);
      });
    }

    // Sort options including Demand (Más Vendidos)
    if (sortBy === 'demanda') arr.sort((a, b) => (b.ventas_acumuladas || 0) - (a.ventas_acumuladas || 0));
    else if (sortBy === 'az') arr.sort((a, b) => a.nombre.localeCompare(b.nombre));
    else if (sortBy === 'za') arr.sort((a, b) => b.nombre.localeCompare(a.nombre));
    else if (sortBy === 'priceDsc') arr.sort((a, b) => b.precio - a.precio);
    else if (sortBy === 'priceAsc') arr.sort((a, b) => a.precio - b.precio);
    else if (sortBy === 'stockDsc') arr.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    else if (sortBy === 'stockAsc') arr.sort((a, b) => (a.stock || 0) - (b.stock || 0));

    return arr;
  };

  const allProductCats = [...new Set(myProductos.flatMap(p => getCats(p)))];
  const allServicioCats = [...new Set(myServicios.flatMap(s => getCats(s)))];

  const filteredProductos = applyFilters(myProductos);
  const filteredServicios = applyFilters(myServicios);

  // Paginated slices (25 per page)
  const paginatedProductos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProductos.slice(start, start + PAGE_SIZE);
  }, [filteredProductos, currentPage]);

  const paginatedServicios = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredServicios.slice(start, start + PAGE_SIZE);
  }, [filteredServicios, currentPage]);

  // Bulk selection helpers
  const enterSelectMode = () => {
    setSelectedIds(activeTab === 'productos' ? filteredProductos.map(p => p.id) : filteredServicios.map(s => s.id));
    setSelectMode(true);
  };
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds([]); };
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(activeTab === 'productos' ? filteredProductos.map(p => p.id) : filteredServicios.map(s => s.id));
  const deselectAll = () => setSelectedIds([]);

  const openBulkDeleteModal = () => { setBulkPwd(''); setBulkPwdError(''); setShowBulkModal(true); };
  const handleBulkDelete = () => {
    if (!verifyPassword(bulkPwd)) { setBulkPwdError('Contraseña incorrecta'); return; }
    if (activeTab === 'productos') {
      selectedIds.forEach(id => deleteProducto(id));
    } else {
      selectedIds.forEach(id => deleteServicio(id));
    }
    setShowBulkModal(false);
    exitSelectMode();
  };

  const isPanelOpen = panel !== null;

  const panelContent = () => {
    if (panel === 'menu') return <ActionMenuPanel onClose={() => setPanel(null)} onSelect={handleMenuSelect} activeTab={activeTab} />;
    if (panel === 'add') return <AddProductPanel onClose={() => setPanel(null)} editItem={editItem} />;
    if (panel === 'addServicio') return <AddServicioPanel onClose={() => setPanel(null)} editItem={editItem} />;
    if (panel === 'cats') return <AddCategoriasPanel onClose={() => setPanel(null)} />;
    if (panel === 'importar') return <ImportDatasetPanel onClose={() => setPanel(null)} />;
    if (panel === 'almacenes') return <AlmacenesPanel onClose={() => setPanel(null)} />;
    return null;
  };

  // Jump from tree branch to filtered Catálogo
  const handleFilterByTreeBranch = (branchName) => {
    setSelectedCats([branchName]);
    setActiveTab('productos');
  };

  return (
    <div className={`flex flex-col flex-1 -m-6 relative overflow-hidden ${ds.pageBg}`}>
      {/* Header */}
      <PageHeader
        onBack={() => navigate('/principal')}
        right={<RefreshButton onRefresh={refreshData} />}
      />

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left / Center Content */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all ${isPanelOpen ? 'w-1/2' : 'w-full'}`}>
          {/* Navigation Tab Bar (3 tabs) */}
          <div className={`flex items-center ${tabBarBg}`}>
            <button
              onClick={() => { setActiveTab('productos'); setSearchText(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative ${
                activeTab === 'productos' ? 'text-white underline underline-offset-4' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Catálogo de Ítems ({myProductos.length})
            </button>
            <button
              onClick={() => { setActiveTab('arbol'); setSearchText(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative flex items-center justify-center gap-1.5 ${
                activeTab === 'arbol' ? 'text-yellow-400 underline underline-offset-4' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FaLayerGroup size={13} /> Árbol de Familias y Categorías
            </button>
            <button
              onClick={() => { setActiveTab('servicios'); setSearchText(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === 'servicios' ? 'text-white underline underline-offset-4' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Servicios ({myServicios.length})
            </button>

            {/* Quick Filter button */}
            {activeTab !== 'arbol' && (
              <div className="relative px-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-white hover:text-yellow-400 transition-colors"
                  title="Filtros y orden"
                >
                  <MdTune size={22} />
                </button>
                {showFilters && (
                  <FilterPanel
                    onClose={() => setShowFilters(false)}
                    sortBy={sortBy} setSortBy={setSortBy}
                    selectedCats={selectedCats} setSelectedCats={setSelectedCats}
                    categorias={activeTab === 'productos' ? allProductCats : allServicioCats}
                    theme={theme}
                    activeTab={activeTab}
                    lotes={lotes}
                    selectedLote={selectedLote}
                    setSelectedLote={setSelectedLote}
                    almacenes={almacenes}
                    selectedWarehouse={selectedWarehouse}
                    setSelectedWarehouse={setSelectedWarehouse}
                    user={user}
                  />
                )}
              </div>
            )}
          </div>

          {/* Search bar & Bulk actions (for Products and Services tabs) */}
          {activeTab !== 'arbol' && (
            <div className={`flex items-center gap-2 px-5 py-3 border-b ${
              ds.isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white/60 border-gray-200'
            }`}>
              <FaSearch size={13} className={ds.subtle} />
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder={activeTab === 'productos'
                  ? 'Buscar por nombre, código de barras, SKU, familia o categoría...'
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
                  }`}
                >
                  ✕
                </button>
              )}

              {/* Active branch filter badge */}
              {selectedCats.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 bg-yellow-500 text-black font-bold rounded-full">
                    Filtro: {selectedCats.join(', ')}
                  </span>
                  <button onClick={() => setSelectedCats([])} className="text-xs text-red-400 hover:underline">
                    Quitar
                  </button>
                </div>
              )}

              {/* Bulk select buttons */}
              <div className="ml-auto">
                {!selectMode ? (
                  <Btn variant="secondary" size="sm" leftIcon={<FaCheckSquare size={12} />} onClick={enterSelectMode}>
                    Seleccionar
                  </Btn>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${ds.muted}`}>{selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}</span>
                    <Btn variant="secondary" size="sm" onClick={selectAll}>Todo</Btn>
                    <Btn variant="secondary" size="sm" onClick={deselectAll}>Ninguno</Btn>
                    <Btn
                      variant="danger" size="sm"
                      leftIcon={<FaTrash size={11} />}
                      onClick={openBulkDeleteModal}
                      disabled={selectedIds.length === 0}>
                      Eliminar
                    </Btn>
                    <Btn variant="secondary" size="sm" onClick={exitSelectMode}>Cancelar</Btn>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: Catálogo de Ítems */}
          {activeTab === 'productos' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5">
                {filteredProductos.length === 0 ? (
                  <EmptyState icon={<FaBoxOpen />} title="Sin productos" message="No hay productos que coincidan con los filtros aplicados. Presiona + para agregar." />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {paginatedProductos.map(p => (
                      <ProductCard
                        key={p.id}
                        item={p}
                        selectMode={selectMode}
                        isSelected={selectedIds.includes(p.id)}
                        toggleSelect={toggleSelect}
                        onEdit={() => { setEditItem(p); setPanel('add'); }}
                        onDelete={() => setDeleteTarget({ type: 'producto', id: p.id, nombre: p.nombre })}
                        onInspectVariants={(prod) => setInspectingProduct(prod)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Strict 25-record pagination */}
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredProductos.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                ds={ds}
              />
            </div>
          )}

          {/* VIEW: Árbol de Familias y Categorías */}
          {activeTab === 'arbol' && (
            <TreeViewModule
              arbolCategorias={arbolCategorias}
              productos={myProductos}
              onFilterByBranch={handleFilterByTreeBranch}
              addFamilia={addFamilia}
              updateFamilia={updateFamilia}
              deleteFamilia={deleteFamilia}
              addCategoriaNode={addCategoriaNode}
              updateCategoriaNode={updateCategoriaNode}
              deleteCategoriaNode={deleteCategoriaNode}
              addSubcategoriaNode={addSubcategoriaNode}
              updateSubcategoriaNode={updateSubcategoriaNode}
              deleteSubcategoriaNode={deleteSubcategoriaNode}
              theme={theme}
              ds={ds}
            />
          )}

          {/* VIEW: Servicios */}
          {activeTab === 'servicios' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5">
                {filteredServicios.length === 0 ? (
                  <EmptyState icon={<FaBoxOpen />} title="Sin servicios" message="No hay servicios aún. Presiona + para agregar." />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {paginatedServicios.map(s => (
                      <ServicioCard
                        key={s.id}
                        item={s}
                        selectMode={selectMode}
                        isSelected={selectedIds.includes(s.id)}
                        toggleSelect={toggleSelect}
                        onEdit={() => { setEditItem(s); setPanel('addServicio'); }}
                        onDelete={() => setDeleteTarget({ type: 'servicio', id: s.id, nombre: s.nombre })}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Strict 25-record pagination */}
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredServicios.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                ds={ds}
              />
            </div>
          )}

        </div>

        {/* Right Slide Panel */}
        <div
          className={`transition-all duration-300 overflow-hidden relative h-full ${isPanelOpen ? 'w-1/2 border-l border-gray-300' : 'w-0'}`}
          style={{ borderColor: theme === 'dark' ? '#374151' : '#d1d5db' }}
        >
          {isPanelOpen && <div className="h-full">{panelContent()}</div>}
        </div>
      </div>

      {/* Floating + button */}
      {!isPanelOpen && !selectMode && (
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
              <Btn
                variant="primary" fullWidth onClick={() => { setNoLoteAlert(false); navigate('/lotes'); }}
                className="bg-yellow-500! text-black! hover:bg-yellow-400!"
              >
                Ir a Lotes
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Variants Inspection Modal */}
      {inspectingProduct && (
        <VariantsInspectionModal
          product={inspectingProduct}
          onClose={() => setInspectingProduct(null)}
          theme={theme}
          ds={ds}
        />
      )}

      {/* Auth Delete Modal (Individual Delete) */}
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

      {/* Bulk Delete Modal */}
      {showBulkModal && (
        <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
          <Card variant="raised" className="w-full max-w-sm flex flex-col gap-4 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <FaTrash className="text-red-400" size={20} />
              </div>
              <h3 className={`font-bold text-lg ${ds.text}`}>Eliminar Múltiples</h3>
              <p className={`text-sm mt-1 ${ds.muted}`}>
                Confirma con tu contraseña para eliminar <strong>{selectedIds.length} elemento{selectedIds.length !== 1 ? 's' : ''}</strong> de forma permanente.
              </p>
            </div>
            {bulkPwdError && <p className="text-red-400 text-sm">{bulkPwdError}</p>}
            <input
              type="password"
              value={bulkPwd}
              onChange={e => { setBulkPwd(e.target.value); setBulkPwdError(''); }}
              placeholder="Contraseña"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleBulkDelete()}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 ${ds.inputDarkFilled}`}
            />
            <div className="flex gap-3">
              <Btn variant="secondary" fullWidth onClick={() => setShowBulkModal(false)}>Cancelar</Btn>
              <Btn variant="danger" fullWidth onClick={handleBulkDelete}>Eliminar Todo</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Inventario;

