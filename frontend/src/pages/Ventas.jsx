import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useInventario } from '../context/InventarioContext';
import { useEmpresa } from '../context/EmpresaContext';
import { useAuth } from '../context/AuthContext';
import { simulatedClients } from '../data/simulatedClients';
import {
  FaArrowLeft, FaSearch, FaShoppingCart, FaTrash, FaImage,
  FaPlus, FaMinus, FaTimes, FaChevronDown, FaChevronUp,
  FaLock, FaCashRegister, FaFire, FaLayerGroup, FaCheckCircle,
  FaPaperPlane,
} from 'react-icons/fa';
import { MdTune } from 'react-icons/md';
import PageHeader from '../components/ui/PageHeader';
import RefreshButton from '../components/ui/RefreshButton';
import { useCRM } from '../context/CRMContext';
import { useFinanzas } from '../context/FinanzasContext';
import { usePermission } from '../hooks/usePermission';
import { useDS } from '../hooks/useDS';
import { todayLima, getBranches } from '../utils/businessData';
import {
  validateSale,
  validateQuoteForCRM,
  calculateCreditSummary,
  resolvePosAccessState,
  allowsDecimals,
  getUnitLabel,
  hasProductVariants,
  normalizeQty,
  calcExactSubtotal,
  ADELANTO_PAYMENT_METHODS,
  ADELANTO_METHOD_TO_KEY,
  TOP_DEMAND_LIMIT,
} from '../utils/saleRules';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Btn from '../components/ui/Btn';
import Badge from '../components/ui/Badge';
import {
  validateDocNumber, validatePhone, validateEmail,
  validateName, sanitizeName, sanitizePhone, sanitizeDocNumber,
} from '../utils/clientValidations';


/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
const DOC_TYPES = ['DNI', 'CE', 'RUC'];
const SALE_TYPES = ['Ticket', 'Boleta', 'Factura', 'Cotizar'];

/* ─────────────────────────────────────────────────────────────────
   MODAL SELECTOR RÁPIDO DE VARIANTES (Talla / Color)
───────────────────────────────────────────────────────────────── */
const VariantSelectorModal = ({ product, cart, onAddVariant, onClose }) => {
  const ds = useDS();
  const variantes = Array.isArray(product?.variantes) ? product.variantes : [];
  const tallas = product?.tallas?.length
    ? product.tallas
    : [...new Set(variantes.map((v) => v.talla).filter(Boolean))];
  const colores = product?.colores?.length
    ? product.colores
    : [...new Set(variantes.map((v) => v.color).filter(Boolean))];

  const firstAvailable = variantes.find((v) => Number(v.stock || 0) > 0) || variantes[0] || null;
  const [selectedTalla, setSelectedTalla] = useState(firstAvailable?.talla || tallas[0] || '');
  const [selectedColor, setSelectedColor] = useState(firstAvailable?.color || colores[0] || '');
  const [qtyInput, setQtyInput] = useState('1');

  if (!product) return null;

  const isDec = allowsDecimals(product);
  const unitLabel = getUnitLabel(product);

  const getCartQtyForVariant = (varId) => {
    const key = `${product.id}::${varId}`;
    const found = cart.find((c) => (c.cartKey || String(c.item.id)) === key);
    return found ? Number(found.qty || 0) : 0;
  };

  const selectedVariant = variantes.find(
    (v) => String(v.talla) === String(selectedTalla) && String(v.color) === String(selectedColor)
  ) || null;

  const inCartQty = selectedVariant ? getCartQtyForVariant(selectedVariant.id) : 0;
  const physicalStock = selectedVariant ? Number(selectedVariant.stock || 0) : 0;
  const availableToAdd = Math.max(0, isDec ? Math.round((physicalStock - inCartQty) * 1000) / 1000 : physicalStock - inCartQty);
  const unitPrice = Number(selectedVariant?.precio ?? product.precio ?? 0);
  const parsedQty = normalizeQty(qtyInput, isDec);
  const validQty = parsedQty > 0 && parsedQty <= availableToAdd;

  const handleConfirm = () => {
    if (!selectedVariant || !validQty) return;
    onAddVariant(product, selectedVariant, parsedQty);
    onClose();
  };

  return (
    <div className={`fixed inset-0 ${ds.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
      <Card variant="raised" padding="md" className={`w-full max-w-lg flex flex-col gap-4 max-h-[90vh] overflow-y-auto ${ds.text}`}>
        <div className={`flex items-start justify-between gap-3 pb-3 border-b ${ds.divider}`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color="indigo" dot>Selector de Variantes</Badge>
              <span className={`text-xs font-semibold ${ds.muted}`}> S/. {unitPrice.toFixed(2)} / {unitLabel}</span>
            </div>
            <h3 className="font-bold text-base mt-1">{product.nombre}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de variantes"
            className={`p-1.5 rounded-lg hover:text-red-400 transition-colors ${ds.muted}`}
          >
            <FaTimes size={15} />
          </button>
        </div>

        {/* Selector de Talla */}
        {tallas.length > 0 && (
          <div className="space-y-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ${ds.muted}`}>1. Selecciona Talla</label>
            <div className="flex flex-wrap gap-2">
              {tallas.map((t) => {
                const isSelected = String(selectedTalla) === String(t);
                const totalTallaStock = variantes
                  .filter((v) => String(v.talla) === String(t))
                  .reduce((sum, v) => sum + Math.max(0, Number(v.stock || 0) - getCartQtyForVariant(v.id)), 0);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTalla(t)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-yellow-500 text-black border-yellow-500 shadow-sm'
                        : `${ds.cardFlat} ${ds.text} hover:border-yellow-500/50`
                    } ${totalTallaStock <= 0 ? 'opacity-50' : ''}`}
                  >
                    Talla {t} <span className="text-[10px] opacity-80">({totalTallaStock})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selector de Color */}
        {colores.length > 0 && (
          <div className="space-y-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ${ds.muted}`}>2. Selecciona Color</label>
            <div className="flex flex-wrap gap-2">
              {colores.map((c) => {
                const isSelected = String(selectedColor) === String(c);
                const matchingVar = variantes.find(
                  (v) => String(v.talla) === String(selectedTalla) && String(v.color) === String(c)
                );
                const rem = matchingVar ? Math.max(0, Number(matchingVar.stock || 0) - getCartQtyForVariant(matchingVar.id)) : 0;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-yellow-500 text-black border-yellow-500 shadow-sm'
                        : `${ds.cardFlat} ${ds.text} hover:border-yellow-500/50`
                    } ${rem <= 0 ? 'opacity-50' : ''}`}
                  >
                    {c} <span className="text-[10px] opacity-80">({rem} disp.)</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabla rápida de stock disponible por variante */}
        <div className="space-y-1.5">
          <span className={`text-xs font-bold uppercase tracking-wider ${ds.muted}`}>Disponibilidad por Variante (Talla / Color)</span>
          <div className={`rounded-xl border overflow-hidden max-h-44 overflow-y-auto ${ds.divider}`}>
            <table className="w-full text-xs">
              <thead className={`${ds.cardFlat} border-b ${ds.divider}`}>
                <tr>
                  <th className="py-2 px-3 text-left">Talla</th>
                  <th className="py-2 px-3 text-left">Color</th>
                  <th className="py-2 px-3 text-left">SKU</th>
                  <th className="py-2 px-3 text-right">Precio</th>
                  <th className="py-2 px-3 text-right">Stock Disp.</th>
                </tr>
              </thead>
              <tbody>
                {variantes.map((v) => {
                  const inCart = getCartQtyForVariant(v.id);
                  const disp = Math.max(0, Number(v.stock || 0) - inCart);
                  const isActive = selectedVariant?.id === v.id;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => {
                        setSelectedTalla(v.talla);
                        setSelectedColor(v.color);
                      }}
                      className={`border-t cursor-pointer transition-colors ${ds.divider} ${
                        isActive ? 'bg-yellow-500/15 font-bold' : 'hover:bg-yellow-500/5'
                      }`}
                    >
                      <td className="py-2 px-3">{v.talla}</td>
                      <td className="py-2 px-3">{v.color}</td>
                      <td className={`py-2 px-3 font-mono text-[11px] ${ds.muted}`}>{v.sku || v.barcode || '—'}</td>
                      <td className="py-2 px-3 text-right">S/. {Number(v.precio ?? product.precio ?? 0).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">
                        <Badge color={disp > 0 ? 'green' : 'red'} size="sm">
                          {disp} {unitLabel}{inCart > 0 ? ` (${inCart} en carrito)` : ''}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen de variante seleccionada + cantidad */}
        <div className={`rounded-xl border p-3 flex flex-wrap items-center justify-between gap-3 ${ds.cardFlat}`}>
          <div>
            <p className="text-xs font-bold">
              {selectedVariant
                ? `Variante: Talla ${selectedVariant.talla} · Color ${selectedVariant.color}`
                : 'Combinación no disponible'}
            </p>
            <p className={`text-xs ${ds.muted}`}>
              Stock disponible: <strong>{availableToAdd} {unitLabel}</strong>
              {inCartQty > 0 ? ` (En carrito: ${inCartQty})` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              aria-label="Cantidad variante"
              type="number"
              size="sm"
              min={isDec ? '0.001' : '1'}
              max={availableToAdd}
              step={isDec ? '0.001' : '1'}
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              className="w-24 text-center"
            />
            <span className="text-xs font-bold">
              Subtotal: S/. {calcExactSubtotal(validQty ? parsedQty : 0, unitPrice).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn
            type="button"
            variant="primary"
            disabled={!selectedVariant || !validQty}
            onClick={handleConfirm}
          >
            Agregar al Carrito
          </Btn>
        </div>
      </Card>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   STEP 1 – Product selection + cart
───────────────────────────────────────────────────────────────── */
const StepProductos = ({ cart, setCart, onNext, theme, pageBg, sucursalId, onSucursalChange, crmPreloadInfo }) => {
  const ds = useDS();
  const { isGlobalScope } = usePermission();
  const navigate = useNavigate();
  const { productos, servicios, categorias, arbolCategorias = [], lotes, almacenes, refreshData } = useInventario();

  const [typeFilter, setTypeFilter] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [familiaFilter, setFamiliaFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loteFilter, setLoteFilter] = useState('');
  const [almacenFilter, setAlmacenFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showFamiliaMenu, setShowFamiliaMenu] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [showLoteMenu, setShowLoteMenu] = useState(false);
  const [showAlmacenMenu, setShowAlmacenMenu] = useState(false);
  const [showCart, setShowCart] = useState(() => cart.length > 0);
  const [rawInputs, setRawInputs] = useState({});
  const [variantModalProduct, setVariantModalProduct] = useState(null);

  const typeRef = useRef(null);
  const familiaRef = useRef(null);
  const catRef = useRef(null);
  const loteRef = useRef(null);
  const almacenRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) setShowTypeMenu(false);
      if (familiaRef.current && !familiaRef.current.contains(e.target)) setShowFamiliaMenu(false);
      if (catRef.current && !catRef.current.contains(e.target)) setShowCatMenu(false);
      if (loteRef.current && !loteRef.current.contains(e.target)) setShowLoteMenu(false);
      if (almacenRef.current && !almacenRef.current.contains(e.target)) setShowAlmacenMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const userSucursalId = String(sucursalId);
  const allowedAlmacenes = (almacenes || []).filter(w => String(w.sucursalId) === userSucursalId);

  const allowedLotes = lotes.filter(l => {
    const almacenOfLote = almacenes.find(w => Number(w.id) === Number(l.almacenId));
    if (!almacenOfLote) return false;
    const matchesBranch = String(almacenOfLote.sucursalId) === userSucursalId;
    const matchesAlmacen = !almacenFilter || Number(l.almacenId) === Number(almacenFilter);
    return matchesBranch && matchesAlmacen;
  });

  const visibleServicios = servicios.filter(s => String(s.sucursalId) === String(userSucursalId));

  const allItems = [
    ...productos.map(p => ({ ...p, _type: 'Producto' })),
    ...visibleServicios.map(s => ({ ...s, _type: 'Servicio' })),
  ];

  const allFamilias = [
    ...new Set([
      ...(arbolCategorias || []).map(f => f.nombre).filter(Boolean),
      ...productos.map(p => p.familia).filter(Boolean),
    ]),
  ];

  const selectedFamiliaNode = (arbolCategorias || []).find(f => f.nombre === familiaFilter);
  const allCats = familiaFilter && selectedFamiliaNode
    ? [...new Set((selectedFamiliaNode.categorias || []).map(c => c.nombre))]
    : [...new Set([...(categorias?.productos || []), ...(categorias?.servicios || [])])];

  const qRaw = searchText.trim();
  const q = qRaw.toLowerCase();
  const isSearchAndFilterEmpty = !qRaw && !familiaFilter && !catFilter && !loteFilter && !almacenFilter && typeFilter === 'Todos';

  const filtered = allItems.filter(item => {
    const matchType = typeFilter === 'Todos'
      || (typeFilter === 'Productos' && item._type === 'Producto')
      || (typeFilter === 'Servicios' && item._type === 'Servicio');

    const matchVariantSearch = Array.isArray(item.variantes) && item.variantes.some(
      v => (v.barcode && String(v.barcode).toLowerCase().includes(q))
        || (v.sku && String(v.sku).toLowerCase().includes(q))
    );
    const matchSearch = !qRaw
      || (item.nombre && item.nombre.toLowerCase().includes(q))
      || (item.codigoBarras && String(item.codigoBarras).toLowerCase().includes(q))
      || (item.sku && String(item.sku).toLowerCase().includes(q))
      || matchVariantSearch;

    const itemCats = Array.isArray(item.categorias) ? item.categorias : (item.categoria ? [item.categoria] : []);
    const matchFamilia = !familiaFilter || item.familia === familiaFilter || itemCats.includes(familiaFilter);
    const matchCat = !catFilter || item.categoria === catFilter || itemCats.includes(catFilter);
    const matchLote = !loteFilter || (item._type === 'Producto' && Number(item.loteId) === Number(loteFilter));

    let matchAlmacen = true;
    if (item._type === 'Producto') {
      const lote = lotes.find(l => Number(l.id) === Number(item.loteId));
      if (!lote) {
        matchAlmacen = false;
      } else {
        const isAllowed = allowedAlmacenes.some(w => Number(w.id) === Number(lote.almacenId));
        matchAlmacen = isAllowed && (!almacenFilter || Number(lote.almacenId) === Number(almacenFilter));
      }
    }

    return matchType && matchSearch && matchFamilia && matchCat && matchLote && matchAlmacen;
  });

  // Sort by ventas_acumuladas descending (boost exact barcode match when searching)
  const sortedItems = [...filtered].sort((a, b) => {
    if (qRaw) {
      const aExact = String(a.codigoBarras || '') === qRaw || (a.variantes || []).some(v => String(v.barcode || '') === qRaw);
      const bExact = String(b.codigoBarras || '') === qRaw || (b.variantes || []).some(v => String(v.barcode || '') === qRaw);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
    }
    return (Number(b.ventas_acumuladas) || 0) - (Number(a.ventas_acumuladas) || 0);
  });

  const totalPages = isSearchAndFilterEmpty
    ? 1
    : Math.max(1, Math.ceil(sortedItems.length / TOP_DEMAND_LIMIT));
  const safePage = Math.min(currentPage, totalPages);
  const displayedItems = isSearchAndFilterEmpty
    ? sortedItems.slice(0, TOP_DEMAND_LIMIT)
    : sortedItems.slice((safePage - 1) * TOP_DEMAND_LIMIT, safePage * TOP_DEMAND_LIMIT);

  const getLineKey = (line) => line.cartKey || String(line.item.id);

  const cartCount = cart.reduce((s, i) => s + (allowsDecimals(i.item) ? 1 : Number(i.qty || 0)), 0);
  const cartTotal = Number(cart.reduce((s, i) => s + calcExactSubtotal(i.qty, i.item.precio), 0).toFixed(2));

  const getQty = (key) => cart.find(c => getLineKey(c) === String(key))?.qty || 0;
  const getParentCartQty = (parentId) => cart
    .filter(c => String(c.item.parentProductId ?? c.item.id) === String(parentId))
    .reduce((sum, c) => sum + Number(c.qty || 0), 0);

  const getMaxQty = (item) => {
    if (item._type !== 'Producto') return 999;
    return Number(item.stock ?? 999);
  };

  const setQtyByKey = (item, rawQty, customKey = null) => {
    const key = customKey || String(item.id);
    const isDec = allowsDecimals(item);
    const max = getMaxQty(item);
    let qty = Math.max(0, Math.min(Number(rawQty) || 0, max));
    qty = isDec ? Math.round(qty * 1000) / 1000 : Math.trunc(qty);

    setCart(prev => {
      const existing = prev.find(c => getLineKey(c) === key);
      if (qty <= 0) return prev.filter(c => getLineKey(c) !== key);
      if (existing) return prev.map(c => getLineKey(c) === key ? { ...c, qty } : c);
      return [...prev, { cartKey: key, item, qty }];
    });
  };

  const handleAddVariantToCart = (parentProduct, variant, addQty) => {
    const key = `${parentProduct.id}::${variant.id}`;
    const isDec = allowsDecimals(parentProduct);
    const maxVarStock = Number(variant.stock || 0);
    const currentInCart = getQty(key);
    const nextQty = Math.min(
      maxVarStock,
      isDec ? Math.round((currentInCart + addQty) * 1000) / 1000 : Math.trunc(currentInCart + addQty)
    );
    if (nextQty <= 0) return;

    const variantCartItem = {
      ...parentProduct,
      id: key,
      parentProductId: parentProduct.id,
      varianteId: variant.id,
      varianteTalla: variant.talla,
      varianteColor: variant.color,
      varianteSku: variant.sku || variant.barcode || parentProduct.codigoBarras,
      nombre: `${parentProduct.nombre} (Talla ${variant.talla} / ${variant.color})`,
      nombreBase: parentProduct.nombre,
      precio: Number(variant.precio ?? parentProduct.precio ?? 0),
      costo: Number(variant.costo ?? parentProduct.costo ?? 0),
      stock: maxVarStock,
      loteId: variant.loteId ?? parentProduct.loteId,
      _type: 'Producto',
      variantes: [], // Cart line represents a specific resolved child variant
    };

    setQtyByKey(variantCartItem, nextQty, key);
    setShowCart(true);
  };

  const removeFromCart = (key) => {
    const strKey = String(key);
    setCart(prev => prev.filter(c => getLineKey(c) !== strKey));
    setRawInputs(prev => {
      const next = { ...prev };
      delete next[strKey];
      return next;
    });
  };
  const clearCart = () => { setCart([]); setRawInputs({}); };

  const getDisplayQty = (key) => {
    const strKey = String(key);
    if (strKey in rawInputs) return rawInputs[strKey];
    return String(getQty(strKey));
  };

  const handleQtyInputChange = (item, val, customKey = null) => {
    const key = String(customKey || item.id);
    setRawInputs(prev => ({ ...prev, [key]: val }));
    const isDec = allowsDecimals(item);
    const parsed = isDec ? parseFloat(val) : parseInt(val, 10);
    if (isDec) {
      if (!isNaN(parsed) && parsed > 0) setQtyByKey(item, parsed, key);
    } else {
      if (!isNaN(parsed) && parsed >= 0) setQtyByKey(item, parsed, key);
    }
  };

  const handleQtyInputBlur = (item, customKey = null) => {
    const key = String(customKey || item.id);
    const raw = rawInputs[key];
    if (raw !== undefined) {
      const isDec = allowsDecimals(item);
      const parsed = isDec ? parseFloat(raw) : parseInt(raw, 10);
      const val = Math.max(0, isNaN(parsed) ? 0 : parsed);
      setQtyByKey(item, val, key);
      setRawInputs(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const inputCls = theme === 'dark'
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const dropBg = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800';

  return (
    <div className={`flex flex-col flex-1 min-h-0 -m-6 ${pageBg}`}>
      <PageHeader
        onBack={() => navigate('/principal')}
        right={
          <>
            {crmPreloadInfo && (
              <Badge color="indigo" dot>
                CRM: {crmPreloadInfo.oportunidadId}
              </Badge>
            )}
            <Input
              as="select"
              aria-label="Sucursal POS"
              value={sucursalId}
              disabled={!isGlobalScope || cart.length > 0}
              onChange={e => { onSucursalChange(e.target.value); setCurrentPage(1); }}
            >
              {getBranches().filter(b => isGlobalScope || String(b.id) === String(sucursalId)).map(b => (
                <option key={b.id} value={b.id}>{b.nombre || b.nombreComercial}</option>
              ))}
            </Input>
            <RefreshButton onRefresh={refreshData} />
          </>
        }
      />

      {/* Main */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Products area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2.5 px-6 pt-4 pb-2 flex-wrap">
            {/* Tipo dropdown */}
            <div ref={typeRef} className="relative">
              <button
                type="button"
                onClick={() => setShowTypeMenu(!showTypeMenu)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium min-w-[100px] ${inputCls}`}
              >
                {typeFilter} {showTypeMenu ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>
              {showTypeMenu && (
                <div className={`absolute top-full left-0 mt-1 w-36 rounded-2xl border shadow-xl z-30 py-1 ${dropBg}`}>
                  {['Productos', 'Servicios', 'Todos'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTypeFilter(t); setCurrentPage(1); setShowTypeMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-yellow-500/10 transition-colors
                        ${typeFilter === t ? 'font-bold text-yellow-500' : ''}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div className={`flex items-center flex-1 min-w-[220px] gap-2 px-4 py-2 border rounded-full ${inputCls}`}>
              <FaSearch className="text-gray-400" size={14} />
              <input
                value={searchText}
                onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
                placeholder="Buscar por nombre, SKU o código de barras..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => { setSearchText(''); setCurrentPage(1); }}
                  aria-label="Limpiar búsqueda"
                  className="text-gray-400 hover:text-red-400"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>

            {/* Familia filter */}
            {allFamilias.length > 0 && (
              <div ref={familiaRef} className="relative z-20">
                <button
                  type="button"
                  onClick={() => setShowFamiliaMenu(!showFamiliaMenu)}
                  className={`flex items-center gap-2 px-3.5 py-2 border rounded-full text-xs font-semibold ${inputCls} hover:border-yellow-500 transition-colors`}
                >
                  {familiaFilter || 'Familia'} {showFamiliaMenu ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </button>
                {showFamiliaMenu && (
                  <div className={`absolute top-full right-0 mt-1 w-48 rounded-2xl border shadow-xl z-30 py-2 ${dropBg}`}>
                    <button
                      type="button"
                      onClick={() => { setFamiliaFilter(''); setCatFilter(''); setCurrentPage(1); setShowFamiliaMenu(false); }}
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${!familiaFilter ? 'font-bold text-yellow-500' : ''}`}
                    >
                      Todas las Familias
                    </button>
                    {allFamilias.map(fam => (
                      <button
                        key={fam}
                        type="button"
                        onClick={() => { setFamiliaFilter(fam); setCatFilter(''); setCurrentPage(1); setShowFamiliaMenu(false); }}
                        className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${familiaFilter === fam ? 'font-bold text-yellow-500' : ''}`}
                      >
                        {fam}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category filter */}
            <div ref={catRef} className="relative z-20">
              <button
                type="button"
                onClick={() => setShowCatMenu(!showCatMenu)}
                title="Filtrar por Categoría"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold ${inputCls} hover:border-yellow-500 transition-colors`}
              >
                <MdTune size={16} />
                <span>{catFilter || 'Categoría'}</span>
              </button>
              {showCatMenu && allCats.length > 0 && (
                <div className={`absolute top-full right-0 mt-1 w-48 rounded-2xl border shadow-xl z-30 py-2 ${dropBg}`}>
                  <button
                    type="button"
                    onClick={() => { setCatFilter(''); setCurrentPage(1); setShowCatMenu(false); }}
                    className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${!catFilter ? 'font-bold text-yellow-500' : ''}`}
                  >
                    Todas las Categorías
                  </button>
                  {allCats.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setCatFilter(c); setCurrentPage(1); setShowCatMenu(false); }}
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${catFilter === c ? 'font-bold text-yellow-500' : ''}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Almacén filter */}
            {typeFilter !== 'Servicios' && allowedAlmacenes.length > 0 && (
              <div ref={almacenRef} className="relative z-20">
                <button
                  type="button"
                  onClick={() => setShowAlmacenMenu(!showAlmacenMenu)}
                  className={`flex items-center gap-2 px-3.5 py-2 border rounded-full text-xs font-semibold ${inputCls} hover:border-yellow-500 transition-colors`}
                >
                  {almacenFilter ? (allowedAlmacenes.find(w => w.id === Number(almacenFilter))?.nombre || 'Almacén') : 'Todos los Almacenes'} {showAlmacenMenu ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </button>
                {showAlmacenMenu && (
                  <div className={`absolute top-full left-0 mt-1 w-48 rounded-2xl border shadow-xl z-30 py-2 ${dropBg}`}>
                    <button
                      type="button"
                      onClick={() => { setAlmacenFilter(''); setLoteFilter(''); setCurrentPage(1); setShowAlmacenMenu(false); }}
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${!almacenFilter ? 'font-bold text-yellow-500' : ''}`}
                    >
                      Todos los Almacenes
                    </button>
                    {allowedAlmacenes.map(w => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => { setAlmacenFilter(w.id); setLoteFilter(''); setCurrentPage(1); setShowAlmacenMenu(false); }}
                        className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${almacenFilter === w.id ? 'font-bold text-yellow-500' : ''}`}
                      >
                        {w.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lote filter */}
            {typeFilter !== 'Servicios' && allowedLotes.length > 0 && (
              <div ref={loteRef} className="relative z-20">
                <button
                  type="button"
                  onClick={() => setShowLoteMenu(!showLoteMenu)}
                  className={`flex items-center gap-2 px-3.5 py-2 border rounded-full text-xs font-semibold ${inputCls} hover:border-yellow-500 transition-colors`}
                >
                  {loteFilter ? (allowedLotes.find(l => l.id === Number(loteFilter))?.nombre || 'Lote') : 'Todos los Lotes'} {showLoteMenu ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </button>
                {showLoteMenu && (
                  <div className={`absolute top-full left-0 mt-1 w-44 rounded-2xl border shadow-xl z-30 py-2 ${dropBg}`}>
                    <button
                      type="button"
                      onClick={() => { setLoteFilter(''); setCurrentPage(1); setShowLoteMenu(false); }}
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${!loteFilter ? 'font-bold text-yellow-500' : ''}`}
                    >
                      Todos los Lotes
                    </button>
                    {allowedLotes.map(l => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => { setLoteFilter(l.id); setCurrentPage(1); setShowLoteMenu(false); }}
                        className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${loteFilter === l.id ? 'font-bold text-yellow-500' : ''}`}
                      >
                        {l.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cart icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCart(!showCart)}
                aria-label="Abrir carrito de ventas"
                className={`p-2.5 rounded-full border ${inputCls} hover:border-yellow-500 transition-colors`}
              >
                <FaShoppingCart size={18} />
              </button>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
          </div>

          {/* Info Bar: Top 25 Mayor Demanda / Resultados limitados a 25 */}
          <div className="flex items-center justify-between px-6 pb-3 gap-2 flex-wrap">
            {isSearchAndFilterEmpty ? (
              <div className="flex items-center gap-2">
                <Badge color="amber" dot>Top {TOP_DEMAND_LIMIT} Mayor Demanda</Badge>
                <span className={`text-xs ${ds.muted}`}>
                  Productos y servicios de alta rotación ({displayedItems.length} de {sortedItems.length})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge color="blue" dot>Resultados Filtrados</Badge>
                <span className={`text-xs ${ds.muted}`}>
                  Mostrando {displayedItems.length} de {sortedItems.length} registros (máx. {TOP_DEMAND_LIMIT} por página)
                </span>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-20">
            {displayedItems.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No se encontraron productos o servicios.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayedItems.map(item => {
                    const isVarProduct = hasProductVariants(item);
                    const isDecItem = allowsDecimals(item);
                    const unitLbl = getUnitLabel(item);
                    const qty = isVarProduct ? getParentCartQty(item.id) : getQty(item.id);
                    const maxQty = getMaxQty(item);
                    const isInCart = qty > 0;
                    const ventasAcum = Number(item.ventas_acumuladas || 0);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-4 flex flex-col gap-2 transition-all ${cardBg}
                          ${isInCart ? (theme === 'dark' ? 'border-yellow-500/60' : 'border-yellow-400') : ''}`}
                      >
                        {/* Subtle High-Rotation + Type/Unit Indicator */}
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                            <FaFire size={9} /> Alta rotación · {ventasAcum}
                          </span>
                          <div className="flex items-center gap-1">
                            {isVarProduct && (
                              <Badge color="indigo" size="sm">
                                {item.variantes.length} var.
                              </Badge>
                            )}
                            {item._type === 'Producto' && isDecItem && (
                              <Badge color="blue" size="sm">
                                ⚖️ {item.unidadMedida || unitLbl}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className={`text-xs font-bold uppercase tracking-wide ${isInCart ? 'text-yellow-500' : (theme === 'dark' ? 'text-gray-100' : 'text-gray-800')}`}>
                          {item.nombre}
                        </p>

                        {/* Image */}
                        <div
                          onClick={() => {
                            if (isVarProduct) {
                              setVariantModalProduct(item);
                            } else if (isDecItem) {
                              if (getQty(item.id) === 0 && maxQty > 0) {
                                setQtyByKey(item, Math.min(1, maxQty));
                                setShowCart(true);
                              }
                            } else {
                              setQtyByKey(item, getQty(item.id) + 1);
                            }
                          }}
                          className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                          }`}
                          title={
                            isVarProduct
                              ? 'Haz clic para elegir Talla y Color'
                              : isDecItem
                                ? `Haz clic para agregar o ingresa cantidad en ${unitLbl}`
                                : 'Haz clic para agregar rápido 1 unidad'
                          }
                        >
                          {item.imagen
                            ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain pointer-events-none" />
                            : <FaImage size={32} className={`pointer-events-none ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />}
                        </div>

                        {/* Price */}
                        <p className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                          S/. {parseFloat(item.precio || 0).toFixed(2)}{isDecItem ? ` / ${unitLbl}` : ''}
                        </p>

                        {/* Stock */}
                        {item._type === 'Producto' && (
                          <p className={`text-xs text-center ${(item.stock ?? 0) <= 0 ? 'text-red-400' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}`}>
                            {isDecItem
                              ? `Stock: ${parseFloat(item.stock ?? 0).toFixed(3)} ${unitLbl} disp.`
                              : `Stock: ${item.stock ?? 0} ${unitLbl}`}
                          </p>
                        )}

                        {/* Action / Qty selector by product type */}
                        {isVarProduct ? (
                          <div className="flex flex-col gap-1.5 mt-1">
                            <Btn
                              type="button"
                              size="sm"
                              variant={isInCart ? 'primary' : 'secondary'}
                              fullWidth
                              leftIcon={<FaLayerGroup size={11} />}
                              onClick={() => setVariantModalProduct(item)}
                            >
                              {isInCart ? `Elegir Talla/Color (${qty} en carrito)` : 'Elegir Talla y Color'}
                            </Btn>
                          </div>
                        ) : isDecItem ? (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-full ${inputCls}`}>
                              <span className="text-xs text-gray-400 shrink-0">⚖️</span>
                              <input
                                type="number"
                                aria-label={`Cantidad decimal ${item.nombre}`}
                                value={getDisplayQty(item.id) === '0' ? '' : getDisplayQty(item.id)}
                                onChange={e => handleQtyInputChange(item, e.target.value)}
                                onBlur={() => handleQtyInputBlur(item)}
                                min={0}
                                max={maxQty}
                                step="0.001"
                                placeholder="0.000"
                                className="flex-1 bg-transparent outline-none text-sm text-center"
                              />
                              <span className="text-xs text-gray-400 shrink-0 font-semibold">{unitLbl}</span>
                            </div>
                            {isInCart && (
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-yellow-500">
                                  Subtotal: S/. {calcExactSubtotal(qty, item.precio).toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                                >
                                  Quitar
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => setQtyByKey(item, getQty(item.id) - 1)}
                              disabled={getQty(item.id) === 0}
                              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors
                                disabled:opacity-30 ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-400 text-gray-600 hover:bg-gray-100'}`}
                            >
                              <FaMinus size={10} />
                            </button>
                            <input
                              type="number"
                              aria-label={`Cantidad ${item.nombre}`}
                              value={getDisplayQty(item.id)}
                              onChange={e => handleQtyInputChange(item, e.target.value)}
                              onBlur={() => handleQtyInputBlur(item)}
                              min={0}
                              max={maxQty}
                              className={`w-16 text-center text-sm py-1 border rounded-full outline-none ${inputCls}`}
                            />
                            <button
                              type="button"
                              onClick={() => setQtyByKey(item, getQty(item.id) + 1)}
                              disabled={item._type === 'Producto' && getQty(item.id) >= maxQty}
                              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors
                                disabled:opacity-30 ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-400 text-gray-600 hover:bg-gray-100'}`}
                            >
                              <FaPlus size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination bar when searching/filtering > 25 items */}
                {!isSearchAndFilterEmpty && totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 pb-2">
                    <Btn
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Btn>
                    <span className={`text-xs font-bold ${ds.text}`}>
                      Página {safePage} de {totalPages}
                    </span>
                    <Btn
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Siguiente
                    </Btn>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Cart Side Panel */}
        <div className={`transition-all duration-300 flex flex-col overflow-hidden border-l
          ${showCart ? 'w-80' : 'w-0'}
          ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {showCart && (
            <>
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`font-bold italic text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Carrito de Ventas</h2>
                <button type="button" onClick={() => setShowCart(false)} className="text-gray-400 hover:text-red-400"><FaTimes /></button>
              </div>
              {/* Cart items with inline decimal/unit editing */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                {cart.length === 0 ? (
                  <p className={`text-sm text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>El carrito está vacío</p>
                ) : (
                  cart.map((line) => {
                    const { item, qty } = line;
                    const key = getLineKey(line);
                    const isDec = allowsDecimals(item);
                    const unitLbl = getUnitLabel(item);
                    const lineSubtotal = calcExactSubtotal(qty, item.precio);
                    const maxQty = getMaxQty(item);

                    return (
                      <div
                        key={key}
                        className={`flex flex-col gap-2 px-3 py-3 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold uppercase leading-tight ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                              {item.nombreBase || item.nombre}
                            </p>
                            {item.varianteId && (
                              <div className="mt-1">
                                <Badge color="indigo" size="sm">
                                  Talla {item.varianteTalla} · {item.varianteColor}
                                </Badge>
                              </div>
                            )}
                            <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              S/. {parseFloat(item.precio || 0).toFixed(2)} / {unitLbl}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(key)}
                            aria-label={`Quitar ${item.nombre}`}
                            className="text-red-400 hover:text-red-500 transition-colors shrink-0 p-1"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>

                        {/* Interactive quantity editor inside Cart (supports decimals e.g. 0.750 kg / 2.5 m) */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          {isDec ? (
                            <div className={`flex items-center gap-1 px-2.5 py-1 border rounded-full w-36 ${inputCls}`}>
                              <input
                                type="number"
                                aria-label={`Cantidad en carrito ${item.nombre}`}
                                value={getDisplayQty(key)}
                                onChange={e => handleQtyInputChange(item, e.target.value, key)}
                                onBlur={() => handleQtyInputBlur(item, key)}
                                min="0.001"
                                max={maxQty}
                                step="0.001"
                                className="w-full bg-transparent outline-none text-xs text-center font-semibold"
                              />
                              <span className="text-[11px] text-gray-400 font-bold shrink-0">{unitLbl}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setQtyByKey(item, qty - 1, key)}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                                  theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <FaMinus size={8} />
                              </button>
                              <input
                                type="number"
                                aria-label={`Cantidad en carrito ${item.nombre}`}
                                value={getDisplayQty(key)}
                                onChange={e => handleQtyInputChange(item, e.target.value, key)}
                                onBlur={() => handleQtyInputBlur(item, key)}
                                min={1}
                                max={maxQty}
                                step={1}
                                className={`w-12 text-center text-xs py-0.5 border rounded-full outline-none font-semibold ${inputCls}`}
                              />
                              <button
                                type="button"
                                onClick={() => setQtyByKey(item, qty + 1, key)}
                                disabled={item._type === 'Producto' && qty >= maxQty}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs disabled:opacity-30 ${
                                  theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <FaPlus size={8} />
                              </button>
                            </div>
                          )}
                          <span className={`text-xs font-extrabold ${theme === 'dark' ? 'text-yellow-400' : 'text-gray-900'}`}>
                            S/. {lineSubtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {/* Cart footer */}
              <div className={`border-t px-4 py-4 space-y-3 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>SUBTOTAL</span>
                  <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>S/. {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    className={`flex-1 py-2.5 rounded-full border font-bold text-sm transition-colors
                      ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-400 text-gray-700 hover:bg-gray-100'}`}
                  >
                    VACIAR CARRITO
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCart(false); onNext(); }}
                    disabled={cart.length === 0}
                    className="flex-1 py-2.5 rounded-full bg-gray-800 hover:bg-yellow-500 hover:text-black text-white font-bold text-sm disabled:opacity-40 transition-colors duration-300 cursor-pointer"
                  >
                    SIGUIENTE
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SIGUIENTE button (floating, bottom right) */}
      {!showCart && (
        <button
          type="button"
          onClick={onNext}
          disabled={cart.length === 0}
          className="fixed bottom-8 right-8 flex items-center gap-3 px-7 py-3 bg-gray-700 hover:bg-yellow-500 hover:text-black disabled:opacity-40 text-white font-bold rounded-full shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 z-40"
        >
          SIGUIENTE <FaArrowLeft className="rotate-180" />
        </button>
      )}

      {/* Modal Selector Rápido de Variantes (Talla / Color) */}
      {variantModalProduct && (
        <VariantSelectorModal
          product={variantModalProduct}
          cart={cart}
          onAddVariant={handleAddVariantToCart}
          onClose={() => setVariantModalProduct(null)}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   STEP 2 – Client data + order description
───────────────────────────────────────────────────────────────── */
const StepCliente = ({ cart, onBack, onNext, theme, pageBg, preloadedClient, sucursalId }) => {
  const ds = useDS();
  const { can } = usePermission();
  const { addOportunidad, addSeguimiento } = useCRM();
  const [condicionPago, setCondicionPago] = useState('CONTADO');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [usarAdelanto, setUsarAdelanto] = useState(false);
  const [adelantoMonto, setAdelantoMonto] = useState('');
  const [adelantoMetodo, setAdelantoMetodo] = useState('Efectivo');
  const [saleError, setSaleError] = useState('');
  const [crmQuoteFeedback, setCrmQuoteFeedback] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [client, setClient] = useState(null);
  const [clientForm, setClientForm] = useState({ nombre: '', apellidos: '', documento: '', telefono: '', correo: '' });
  const [clientErrors, setClientErrors] = useState({});
  const [saleType, setSaleType] = useState('Ticket');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedCodes, setAppliedCodes] = useState([]);
  const [discountMsg, setDiscountMsg] = useState('');
  const [addClientMsg, setAddClientMsg] = useState('');

  const { empresa } = useEmpresa();

  // Pre-load client passed from Principal (Venta button) or CRM
  useEffect(() => {
    const preloaded = preloadedClient || location.state?.preloadedClient;
    if (preloaded) {
      setClient(preloaded);
      setDocType(preloaded.docType || 'DNI');
      setDocNumber(preloaded.docNumber || '');
      setClientForm({
        nombre: preloaded.name || '',
        apellidos: preloaded.surname || '',
        documento: preloaded.docNumber || '',
        telefono: preloaded.telefono || '',
        correo: preloaded.correo || '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = cart.reduce((s, { item, qty }) => s + calcExactSubtotal(qty, item.precio), 0);

  const getActivePromotions = () => {
    try {
      const saved = localStorage.getItem('ersoft_promociones');
      const promos = saved ? JSON.parse(saved) : [
        { id: '1', nombre: 'PRUEBA DEF', tipo: 'coupon', valorTipo: '%', valor: 50, codigo: 'PRUEBA2', sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', vigenciaDesde: '2026-04-20', vigenciaHasta: '2026-07-27' },
        { id: '2', nombre: 'PRUEBA 10', tipo: 'coupon', valorTipo: '%', valor: 40, codigo: 'INV2026', sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', vigenciaDesde: '2026-04-29', vigenciaHasta: '2026-08-30' },
        { id: '3', nombre: '40% TODO', tipo: 'product', valorTipo: '%', valor: 40, sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', vigenciaDesde: '2026-04-20', vigenciaHasta: '2026-07-23' },
        { id: '4', nombre: '30% TODO', tipo: 'product', valorTipo: '%', valor: 30, sucursales: 'global', estado: 'Activo', aplicaA: 'categoria', aplicaId: 'Bebidas', vigenciaDesde: '2026-04-20', vigenciaHasta: '2026-07-22' },
        { id: '5', nombre: '3x2', tipo: 'qty', valorTipo: 'PEN', valor: 0, sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', qtyX: 3, qtyY: 2, qtyTipo: 'gratis', vigenciaDesde: '2026-04-18', vigenciaHasta: '2026-07-29' },
        { id: '6', nombre: 'CLIENTES VIP', tipo: 'coupon', valorTipo: '%', valor: 15, codigo: 'VIP2026', sucursales: 'global', estado: 'Activo', aplicaA: 'catalogo', vigenciaDesde: '2026-04-20', vigenciaHasta: '2026-08-30' },
      ];

      const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const todayStr = getLocalDateString();
      const userSucursalId = sucursalId;

      return promos.filter(p => {
        if (p.estado !== 'Activo') return false;
        const branchMatches = p.sucursales === 'global' || 
          (Array.isArray(p.sucursales) && p.sucursales.includes(userSucursalId));
        if (!branchMatches) return false;
        if (p.vigenciaDesde && todayStr < p.vigenciaDesde) return false;
        if (p.vigenciaHasta && todayStr > p.vigenciaHasta) return false;
        return true;
      });
    } catch (e) {
      console.error('Error loading promotions in Ventas:', e);
      return [];
    }
  };

  const calcDiscount = () => {
    const activePromos = getActivePromotions();
    
    // 1. Calculate item-level discounts
    let totalItemDiscounts = 0;
    cart.forEach(({ item, qty }) => {
      const itemSubtotal = calcExactSubtotal(qty, item.precio);

      // Find all matching standard or qty promos for this item
      const matchingPromos = activePromos.filter(p => {
        if (p.tipo === 'product' || p.tipo === 'qty') return true;
        if (p.tipo === 'coupon') {
          return appliedCodes.includes(p.codigo.trim().toUpperCase());
        }
        return false;
      }).filter(p => {
        if (p.aplicaA === 'catalogo') return true;
        if (p.aplicaA === 'categoria') {
          const itemCats = Array.isArray(item.categorias) ? item.categorias : (item.categoria ? [item.categoria] : []);
          return itemCats.includes(p.aplicaId);
        }
        if (p.aplicaA === 'producto') {
          return String(item.parentProductId ?? item.id) === String(p.aplicaId);
        }
        return false;
      });

      const appliedCoupon = matchingPromos.find(p => p.tipo === 'coupon');
      const promoToApply = appliedCoupon || matchingPromos[0];

      let itemDiscount = 0;
      if (promoToApply) {
        if (promoToApply.tipo === 'qty') {
          const qX = parseInt(promoToApply.qtyX) || 1;
          const qY = parseInt(promoToApply.qtyY) || 0;
          if (qty >= qX) {
            const groups = Math.floor(qty / qX);
            const promoQty = groups * (qX - qY);
            if (promoToApply.qtyTipo === 'gratis') {
              itemDiscount = promoQty * (parseFloat(item.precio) || 0);
            } else if (promoToApply.qtyTipo === 'descuento') {
              const pct = parseFloat(promoToApply.qtyDescuento) || 0;
              itemDiscount = promoQty * (parseFloat(item.precio) || 0) * (pct / 100);
            }
          }
        } else {
          if (promoToApply.valorTipo === '%') {
            itemDiscount = (parseFloat(item.precio) || 0) * (parseFloat(promoToApply.valor) / 100) * qty;
          } else {
            itemDiscount = parseFloat(promoToApply.valor) * qty;
          }
        }
      }
      totalItemDiscounts += Math.min(itemSubtotal, itemDiscount);
    });

    // 2. Order-level discounts
    const subtotalAfterItems = subtotal - totalItemDiscounts;
    const orderPromos = activePromos.filter(p => {
      if (p.tipo === 'order') return true;
      if (p.tipo === 'coupon') {
        return p.aplicaA === 'pedido' && appliedCodes.includes(p.codigo.trim().toUpperCase());
      }
      return false;
    });

    const orderPromoToApply = orderPromos.find(p => {
      const minC = parseFloat(p.minCompra) || 0;
      return subtotalAfterItems >= minC;
    });

    let orderDiscount = 0;
    if (orderPromoToApply) {
      if (orderPromoToApply.valorTipo === '%') {
        orderDiscount = subtotalAfterItems * (parseFloat(orderPromoToApply.valor) / 100);
      } else {
        orderDiscount = parseFloat(orderPromoToApply.valor);
      }
    }

    const totalDiscountAmt = totalItemDiscounts + orderDiscount;
    return { rate: subtotal > 0 ? (totalDiscountAmt / subtotal) : 0, amt: totalDiscountAmt };
  };

  const igvRate = 18;
  const { rate: discount, amt: discountAmt } = calcDiscount();
  const total = Number(Math.max(0, subtotal - discountAmt).toFixed(2));
  const opGravada = total / (1 + (igvRate / 100));
  const igvMonto = total - opGravada;

  // Real-time credit summary (Feature 4)
  const effectiveAdelantoInput = condicionPago === 'CREDITO' && usarAdelanto ? Number(adelantoMonto || 0) : 0;
  const creditSummary = calculateCreditSummary(total, effectiveAdelantoInput);

  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputCls = theme === 'dark' ? 'bg-transparent border-gray-600 text-white placeholder-gray-500' : 'bg-transparent border-gray-300 text-gray-900 placeholder-gray-400';
  const sectionBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  const handleSearch = () => {
    setSaleError('');
    setCrmQuoteFeedback(null);
    const allClients = [
      ...simulatedClients,
      ...JSON.parse(localStorage.getItem('ersoft_clients') || '[]'),
    ];
    const found = allClients.find(c => c.docType === docType && c.docNumber === docNumber);
    if (found) {
      setClient(found);
      setClientForm({
        nombre: found.name || '',
        apellidos: found.surname || '',
        documento: found.docNumber || '',
        telefono: found.telefono || '',
        correo: found.correo || '',
      });
    } else {
      setClient(null);
      setClientForm({ nombre: '', apellidos: '', documento: docNumber, telefono: '', correo: '' });
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handleAddClient = () => {
    setSaleError('');
    setCrmQuoteFeedback(null);
    const effectiveDocNumber = docNumber.trim() || clientForm.documento.trim();
    const errs = {};

    const eNombre = docType === 'RUC'
      ? (!clientForm.nombre?.trim() || clientForm.nombre.trim().length < 3 ? 'Razón Social es obligatoria (mín. 3 caracteres).' : null)
      : validateName(clientForm.nombre, 'Nombres');
    const eApellidos = docType === 'RUC' ? null : validateName(clientForm.apellidos, 'Apellidos');
    const eDoc       = validateDocNumber(docType, effectiveDocNumber);
    const eTel       = validatePhone(clientForm.telefono);
    const eEmail     = validateEmail(clientForm.correo);

    if (eNombre)    errs.nombre    = eNombre;
    if (eApellidos) errs.apellidos = eApellidos;
    if (eDoc)       errs.documento = eDoc;
    if (eTel)       errs.telefono  = eTel;
    if (eEmail)     errs.correo    = eEmail;

    if (Object.keys(errs).length > 0) {
      setClientErrors(errs);
      setAddClientMsg('⚠ Corrige los errores antes de continuar.');
      setTimeout(() => setAddClientMsg(''), 4000);
      return;
    }
    setClientErrors({});

    const newClient = {
      id: Date.now(),
      docType,
      docNumber: effectiveDocNumber,
      name: clientForm.nombre.trim(),
      surname: clientForm.apellidos.trim(),
      telefono: clientForm.telefono.trim(),
      correo: clientForm.correo.trim(),
    };
    const saved = JSON.parse(localStorage.getItem('ersoft_clients') || '[]');
    const isDuplicate = effectiveDocNumber && saved.some(
      c => c.docType === docType && c.docNumber === effectiveDocNumber
    );
    if (!isDuplicate) {
      localStorage.setItem('ersoft_clients', JSON.stringify([...saved, newClient]));
    }
    setClient(newClient);
    setClientForm(prev => ({ ...prev, documento: effectiveDocNumber }));
    setAddClientMsg('✓ Cliente guardado y seleccionado');
    setTimeout(() => setAddClientMsg(''), 3000);
  };

  const handleApplyDiscount = () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setDiscountMsg('');
      return;
    }
    if (appliedCodes.includes(code)) {
      setDiscountMsg('✗ Código ya aplicado');
      return;
    }
    const activePromos = getActivePromotions();
    const couponPromo = activePromos.find(p => p.tipo === 'coupon' && p.codigo.trim().toUpperCase() === code);

    if (couponPromo) {
      let appliesToCart = false;
      if (couponPromo.aplicaA === 'catalogo' || couponPromo.aplicaA === 'pedido') {
        appliesToCart = true;
      } else if (couponPromo.aplicaA === 'categoria') {
        appliesToCart = cart.some(({ item }) => {
          const itemCats = Array.isArray(item.categorias) ? item.categorias : (item.categoria ? [item.categoria] : []);
          return itemCats.includes(couponPromo.aplicaId);
        });
      } else if (couponPromo.aplicaA === 'producto') {
        appliesToCart = cart.some(({ item }) => String(item.parentProductId ?? item.id) === String(couponPromo.aplicaId));
      }

      if (appliesToCart) {
        setAppliedCodes([...appliedCodes, code]);
        setDiscountMsg('✓ Cupón aplicado');
        setDiscountCode('');
      } else {
        setDiscountMsg('✗ El cupón no aplica a los productos del carrito');
      }
    } else {
      setDiscountMsg('✗ Código de cupón inválido o expirado');
    }
  };

  const handleRemoveDiscount = (codeToRemove) => {
    setAppliedCodes(appliedCodes.filter(c => c !== codeToRemove));
  };

  const docPlaceholder = { DNI: '8 dígitos', CE: '9 dígitos', RUC: '11 dígitos' };

  const billingMode = empresa.modo_facturacion || 'INTERNO_PRE_FORMALIZACION';
  const isRusRucEmpresa = empresa?.tipoDocumento === 'RUS' || empresa?.tipoDocumento === 'RUC';
  const isRucEmpresa = empresa?.tipoDocumento === 'RUC';
  
  const availableSaleTypes = SALE_TYPES.filter(type => {
    if (billingMode === 'INTERNO_PRE_FORMALIZACION') return ['Ticket', 'Cotizar'].includes(type);
    if (type === 'Cotizar') return true;
    if (type === 'Ticket') return ['DNI', 'CE', 'RUS', 'RUC'].includes(docType);
    if (type === 'Boleta') return isRusRucEmpresa;
    if (type === 'Factura') return isRucEmpresa;
    return true;
  });

  useEffect(() => {
    if (!availableSaleTypes.includes(saleType)) {
      setSaleType(availableSaleTypes[0] || 'Ticket');
    }
  }, [docType, availableSaleTypes, saleType]);

  const handleCotizar = () => {
    const igvRate = 18;
    const opGravada = total / (1 + (igvRate / 100));
    const igvMonto = total - opGravada;
    const saleData = { client: clientForm, saleType, discount, discountAmt, subtotal, total, opGravada, igvMonto, igvRate };
    const html = buildProformaHTML(empresa, cart, saleData, user?.name || user?.username || 'Vendedor');
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  // Feature 5: Guardar como Cotización en CRM (Etapa COTIZADO + alerta en Calendario)
  const handleSaveAsQuoteToCRM = () => {
    setSaleError('');
    setCrmQuoteFeedback(null);
    const effectiveDoc = clientForm.documento?.trim() || docNumber?.trim() || client?.docNumber || client?.documento || '';
    const effectiveNombre = (clientForm.nombre || client?.nombre || client?.name || '').trim();
    const effectiveApellidos = (clientForm.apellidos || client?.apellidos || client?.surname || '').trim();
    const candidateClient = {
      ...client,
      ...clientForm,
      nombre: effectiveNombre,
      apellidos: effectiveApellidos,
      documento: effectiveDoc,
      docType: docType || client?.docType || 'DNI',
    };
    const validationErr = validateQuoteForCRM({ client: candidateClient, cart });
    if (validationErr) {
      setSaleError(validationErr);
      return;
    }

    const clienteNombreCompleto = `${effectiveNombre} ${effectiveApellidos}`.trim();
    const followUpDate = todayLima();
    const itemsCotizados = cart.map(({ item, qty }) => ({
      id: item.parentProductId ?? item.id,
      varianteId: item.varianteId || null,
      varianteTalla: item.varianteTalla || null,
      varianteColor: item.varianteColor || null,
      nombre: item.nombre,
      precio: Number(item.precio || 0),
      qty: Number(qty || 1),
      cantidad: Number(qty || 1),
      unidad_medida: getUnitLabel(item),
      permite_decimales: allowsDecimals(item),
      subtotal: calcExactSubtotal(qty, item.precio),
      tipo: item._type === 'Servicio' ? 'SERVICIO' : 'PRODUCTO',
      _type: item._type || 'Producto',
    }));

    const resumenItems = itemsCotizados
      .map(it => `${it.nombre} x${it.qty} ${it.unidad_medida} (S/ ${it.subtotal.toFixed(2)})`)
      .join(', ');

    const nuevaOp = addOportunidad({
      sucursal_id: String(sucursalId || '1'),
      sucursalId: String(sucursalId || '1'),
      titulo_pedido: `Cotización POS (${saleType}) - ${clienteNombreCompleto}`,
      cliente_nombre: clienteNombreCompleto,
      tipo_documento: candidateClient.docType,
      documento: effectiveDoc,
      cliente_documento: effectiveDoc,
      telefono: (clientForm.telefono || client?.telefono || '').trim(),
      cliente_telefono: (clientForm.telefono || client?.telefono || '').trim(),
      correo: (clientForm.correo || client?.correo || '').trim(),
      cliente_correo: (clientForm.correo || client?.correo || '').trim(),
      etapa: 'COTIZADO',
      monto_estimado: Number(total.toFixed(2)),
      items_cotizados: itemsCotizados,
      fecha_proximo_contacto: followUpDate,
      origen: 'POS_COTIZACION',
    });

    if (nuevaOp?.oportunidad_id) {
      addSeguimiento({
        oportunidad_id: nuevaOp.oportunidad_id,
        fecha_proximo_contacto: followUpDate,
        realizado: false,
        detalle_conversacion: `Cotización enviada desde POS (${saleType}) por S/ ${total.toFixed(2)}. Detalle: ${resumenItems}`,
      });
    }

    setCrmQuoteFeedback({
      oportunidadId: nuevaOp?.oportunidad_id,
      cliente: clienteNombreCompleto,
      total: total.toFixed(2),
      fechaAlerta: followUpDate,
    });
  };

  const proceed = () => {
    if (!can('ventas_caja', 'CREAR')) return;
    const effectiveDoc = clientForm.documento?.trim() || docNumber?.trim() || '';
    const rawAdelanto = condicionPago === 'CREDITO' && usarAdelanto ? Number(adelantoMonto || 0) : 0;

    if (condicionPago === 'CREDITO' && usarAdelanto) {
      if (!Number.isFinite(rawAdelanto) || rawAdelanto < 0) {
        return setSaleError('El monto de adelanto debe ser un número válido mayor o igual a 0.');
      }
      if (rawAdelanto >= total && total > 0) {
        return setSaleError('El monto de adelanto debe ser menor al total de la venta (para pago total use CONTADO).');
      }
    }

    const data = {
      client: {
        ...clientForm,
        nombre: clientForm.nombre || client?.name || client?.nombre || '',
        apellidos: clientForm.apellidos || client?.surname || client?.apellidos || '',
        documento: effectiveDoc,
        docType,
      },
      saleType,
      discount,
      discountAmt,
      total,
      subtotal,
      opGravada,
      igvMonto,
      igvRate,
      condicion_pago: condicionPago,
      fecha_vencimiento: condicionPago === 'CREDITO' ? fechaVencimiento : null,
      adelanto_monto: condicionPago === 'CREDITO' && usarAdelanto ? Number(rawAdelanto.toFixed(2)) : 0,
      adelanto_metodo: condicionPago === 'CREDITO' && usarAdelanto && rawAdelanto > 0 ? adelantoMetodo : null,
      monto_adelanto: condicionPago === 'CREDITO' && usarAdelanto ? Number(rawAdelanto.toFixed(2)) : 0,
      metodo_pago_adelanto: condicionPago === 'CREDITO' && usarAdelanto && rawAdelanto > 0 ? adelantoMetodo : null,
      saldo_pendiente: condicionPago === 'CREDITO' ? creditSummary.saldoPendienteCredito : 0,
      sucursalId,
    };
    const error = validateSale(data, billingMode);
    if (error) return setSaleError(error);
    setSaleError('');
    onNext(data);
  };

  return (
    <div className={`flex flex-col flex-1 min-h-0 -m-6 ${pageBg}`}>
      <PageHeader onBack={() => navigate('/principal')} />

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Client form */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-5 space-y-4">
          {/* Doc search bar */}
          <div className="flex items-center gap-3">
            <select value={docType} onChange={e => { setDocType(e.target.value); setDocNumber(''); setClient(null); setClientErrors({}); setSaleError(''); }}
              className={`px-3 py-2 border rounded-full text-sm outline-none ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              value={docNumber}
              onChange={e => { setDocNumber(sanitizeDocNumber(docType, e.target.value)); setSaleError(''); }}
              onKeyDown={handleKeyDown}
              placeholder={`Digite aquí la documentación del cliente (${docPlaceholder[docType]})`}
              className={`flex-1 px-4 py-2 border rounded-full text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
            />
            <button type="button" onClick={handleSearch}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full text-sm font-semibold">
              <FaSearch size={13} />
            </button>
          </div>

          {/* SUNAT Mode indicator + Sale type tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`text-xs font-semibold uppercase tracking-wider ${ds.muted}`}>Tipo de comprobante</span>
              <Badge dot color={billingMode === 'SUNAT_PRODUCCION' ? 'green' : billingMode === 'SUNAT_BETA' ? 'blue' : 'amber'}>
                {billingMode === 'INTERNO_PRE_FORMALIZACION' ? 'Modo Interno · NV01' : billingMode === 'SUNAT_BETA' ? 'SUNAT Beta · UBL 2.1' : 'SUNAT Producción · UBL 2.1'}
              </Badge>
            </div>
            <div className={`flex rounded-none overflow-hidden border-b-0 ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#1a1a1a]'}`}>
              {availableSaleTypes.map(t => (
                <button type="button" key={t} onClick={() => { setSaleType(t); setSaleError(''); }}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors
                    ${saleType === t ? 'text-white underline underline-offset-4' : 'text-gray-400 hover:text-gray-200'}`}>
                  {t === 'Ticket' ? 'Nota de Venta NV01' : t === 'Boleta' ? 'Boleta (B001)' : t === 'Factura' ? 'Factura (F001)' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Client form fields */}
          <div className={`rounded-2xl border p-5 space-y-3 ${sectionBg}`}>
            {/* Nombres / Razón Social */}
            <div className="flex items-start gap-2 border-b pb-2">
              <label className={`text-sm w-24 pt-1 ${text}`}>{docType === 'RUC' ? 'Razón Soc.' : 'Nombres'} <span className="text-red-500">*</span></label>
              <div className="flex-1">
                <input
                  value={clientForm.nombre}
                  onChange={e => {
                    const nextVal = docType === 'RUC' ? e.target.value.slice(0, 80) : sanitizeName(e.target.value);
                    setClientForm(p => ({ ...p, nombre: nextVal }));
                    setSaleError('');
                    if (clientErrors.nombre) setClientErrors(p => { const n={...p}; delete n.nombre; return n; });
                  }}
                  placeholder={docType === 'RUC' ? 'ej. Constructora B EIRL' : 'ej. Rodrigo Alberto'}
                  disabled={!!client}
                  className={`w-full text-sm border-b bg-transparent outline-none py-1 ${inputCls} disabled:opacity-60
                    ${clientErrors.nombre ? 'border-red-500' : ''}`}
                />
                {clientErrors.nombre && <p className="text-red-400 text-[11px] mt-0.5">{clientErrors.nombre}</p>}
              </div>
            </div>
            {/* Apellidos */}
            <div className="flex items-start gap-2 border-b pb-2">
              <label className={`text-sm w-24 pt-1 ${text}`}>Apellidos {docType !== 'RUC' && <span className="text-red-500">*</span>}</label>
              <div className="flex-1">
                <input
                  value={clientForm.apellidos}
                  onChange={e => {
                    setClientForm(p => ({ ...p, apellidos: sanitizeName(e.target.value) }));
                    setSaleError('');
                    if (clientErrors.apellidos) setClientErrors(p => { const n={...p}; delete n.apellidos; return n; });
                  }}
                  placeholder={docType === 'RUC' ? 'Opcional para RUC' : 'ej. Garcia Peréz'}
                  disabled={!!client}
                  className={`w-full text-sm border-b bg-transparent outline-none py-1 ${inputCls} disabled:opacity-60
                    ${clientErrors.apellidos ? 'border-red-500' : ''}`}
                />
                {clientErrors.apellidos && <p className="text-red-400 text-[11px] mt-0.5">{clientErrors.apellidos}</p>}
              </div>
            </div>
            {/* Documento + Teléfono */}
            <div className="flex items-start gap-4 border-b pb-2">
              <label className={`text-sm w-24 pt-1 ${text}`}>Documento <span className="text-red-500">*</span></label>
              <div className="flex-1">
                <input value={clientForm.documento}
                  onChange={e => {
                    setClientForm(p => ({ ...p, documento: sanitizeDocNumber(docType, e.target.value) }));
                    setSaleError('');
                    if (clientErrors.documento) setClientErrors(p => { const n={...p}; delete n.documento; return n; });
                  }}
                  placeholder={docPlaceholder[docType]} disabled={!!client}
                  className={`w-full text-sm border-b bg-transparent outline-none py-1 ${inputCls} disabled:opacity-60
                    ${clientErrors.documento ? 'border-red-500' : ''}`} />
                {clientErrors.documento && <p className="text-red-400 text-[11px] mt-0.5">{clientErrors.documento}</p>}
              </div>
              <label className={`text-sm w-16 pt-1 ${text}`}>Teléfono</label>
              <div className="flex-1">
                <input value={clientForm.telefono}
                  onChange={e => {
                    setClientForm(p => ({ ...p, telefono: sanitizePhone(e.target.value) }));
                    if (clientErrors.telefono) setClientErrors(p => { const n={...p}; delete n.telefono; return n; });
                  }}
                  placeholder="9 dígitos" disabled={!!client}
                  className={`w-full text-sm border-b bg-transparent outline-none py-1 ${inputCls} disabled:opacity-60
                    ${clientErrors.telefono ? 'border-red-500' : ''}`} />
                {clientErrors.telefono && <p className="text-red-400 text-[11px] mt-0.5">{clientErrors.telefono}</p>}
              </div>
            </div>
            {/* Correo */}
            <div className="flex items-start gap-2">
              <label className={`text-sm w-24 pt-1 ${text}`}>Correo</label>
              <div className="flex-1">
                <input value={clientForm.correo}
                  onChange={e => {
                    setClientForm(p => ({ ...p, correo: e.target.value }));
                    if (clientErrors.correo) setClientErrors(p => { const n={...p}; delete n.correo; return n; });
                  }}
                  placeholder="ej. cliente_correo@ersoft.pe" disabled={!!client}
                  className={`w-full text-sm border-b bg-transparent outline-none py-1 ${inputCls} disabled:opacity-60
                    ${clientErrors.correo ? 'border-red-500' : ''}`} />
                {clientErrors.correo && <p className="text-red-400 text-[11px] mt-0.5">{clientErrors.correo}</p>}
              </div>
            </div>
          </div>

          {/* AGREGAR CLIENTE — always visible; disabled when client is already selected */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleAddClient}
              disabled={!!client}
              className={`w-full py-3 font-bold text-sm tracking-wider rounded-full transition-all
                ${client
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                  : 'bg-[#1a1a1a] hover:bg-gray-800 text-white active:scale-95'}`}
            >
              AGREGAR CLIENTE
            </button>
            {addClientMsg && (
              <p className={`text-xs text-center font-semibold ${
                addClientMsg.startsWith('✓') ? 'text-green-400' : 'text-yellow-400'
              }`}>{addClientMsg}</p>
            )}
            {client && (
              <div className="flex items-center justify-between px-1">
                <span className="text-green-400 text-sm font-semibold">✓ Cliente seleccionado</span>
                <button
                  type="button"
                  onClick={() => { setClient(null); setDocNumber(''); setClientForm({ nombre: '', apellidos: '', documento: '', telefono: '', correo: '' }); setClientErrors({}); setAddClientMsg(''); setSaleError(''); }}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Cambiar cliente
                </button>
              </div>
            )}
          </div>

          {/* Condición de Pago + Fecha de Vencimiento + Adelanto / Inicial (Feature 4) */}
          <Card className={`space-y-3 ${ds.text}`}>
            <Input
              label="Condición de pago"
              aria-label="Condición de pago"
              as="select"
              value={condicionPago}
              onChange={e => {
                setCondicionPago(e.target.value);
                setSaleError('');
                if (e.target.value !== 'CREDITO') {
                  setUsarAdelanto(false);
                  setAdelantoMonto('');
                }
              }}
            >
              <option value="CONTADO">CONTADO</option>
              <option value="CREDITO">CREDITO</option>
            </Input>

            {condicionPago === 'CREDITO' && (
              <>
                <Input
                  label="Fecha de vencimiento"
                  aria-label="Fecha de vencimiento"
                  type="date"
                  min={todayLima()}
                  value={fechaVencimiento}
                  onChange={e => { setFechaVencimiento(e.target.value); setSaleError(''); }}
                  required
                />

                {/* Sección opcional: Registrar Adelanto / Inicial */}
                <div className={`pt-2 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} space-y-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usarAdelanto}
                        onChange={e => {
                          setUsarAdelanto(e.target.checked);
                          if (!e.target.checked) setAdelantoMonto('');
                          setSaleError('');
                        }}
                        className="rounded border-gray-400 text-yellow-500 focus:ring-yellow-500"
                      />
                      <span>Registrar Adelanto / Inicial (Opcional)</span>
                    </label>
                    <Badge color={creditSummary.adelantoPagadoHoy > 0 ? 'amber' : 'gray'} size="sm">
                      {creditSummary.adelantoPagadoHoy > 0 ? 'Amortización parcial (PARCIAL)' : 'Sin inicial (PENDIENTE)'}
                    </Badge>
                  </div>

                  {usarAdelanto && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <Input
                        label="Monto de Adelanto (S/)"
                        aria-label="Monto de Adelanto (S/)"
                        type="number"
                        min="0"
                        max={Math.max(0, total - 0.01).toFixed(2)}
                        step="0.01"
                        placeholder={`Máx. S/ ${Math.max(0, total - 0.01).toFixed(2)}`}
                        value={adelantoMonto}
                        onChange={e => {
                          setAdelantoMonto(e.target.value);
                          setSaleError('');
                        }}
                      />
                      <Input
                        label="Método de Pago del Adelanto"
                        aria-label="Método de Pago del Adelanto"
                        as="select"
                        value={adelantoMetodo}
                        onChange={e => {
                          setAdelantoMetodo(e.target.value);
                          setSaleError('');
                        }}
                      >
                        {ADELANTO_PAYMENT_METHODS.map((m) => {
                          const val = typeof m === 'string' ? m : m.value;
                          const label = typeof m === 'string' ? m : m.label;
                          return <option key={val} value={val}>{label}</option>;
                        })}
                      </Input>
                    </div>
                  )}
                </div>
              </>
            )}

            {saleError && <p role="alert" className="text-sm text-red-400">{saleError}</p>}
          </Card>

          {/* Confirmación de Cotización enviada al CRM */}
          {crmQuoteFeedback && (
            <Card className="border-emerald-500/40 bg-emerald-500/10 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                  <FaCheckCircle />
                  <span>Cotización guardada en CRM (Etapa: COTIZADO)</span>
                </div>
                <Badge color="green" size="sm">Seguimiento: {crmQuoteFeedback.fechaAlerta}</Badge>
              </div>
              <p className={`text-xs ${ds.text}`}>
                Cliente: <strong>{crmQuoteFeedback.cliente}</strong> · Monto estimado: <strong>S/ {crmQuoteFeedback.total}</strong> · Alerta programada en el Calendario Operativo.
              </p>
              <div className="flex gap-2 pt-1">
                <Btn type="button" size="sm" variant="secondary" onClick={() => navigate('/crm')}>
                  Ver en CRM
                </Btn>
                <Btn type="button" size="sm" variant="ghost" onClick={() => navigate('/calendario')}>
                  Ver en Calendario
                </Btn>
              </div>
            </Card>
          )}

          {/* Back */}
          <button type="button" onClick={onBack} className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} underline`}>
            ← Volver a productos
          </button>

          {/* Discount Code */}
          <div className={`rounded-2xl border p-4 ${sectionBg}`}>
            <p className={`font-bold italic text-sm mb-2 ${text}`}>Código de DSCT</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Ingrese el COD aquí</span>
                <input value={discountCode} onChange={e => setDiscountCode(e.target.value)}
                  className={`flex-1 text-sm border-b bg-transparent outline-none py-1 ${inputCls}`} />
                <button type="button" onClick={handleApplyDiscount}
                  className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-full">
                  APLICAR
                </button>
              </div>
              {discountMsg && (
                <p className={`text-xs ${discountMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{discountMsg}</p>
              )}
              {appliedCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {appliedCodes.map(code => (
                    <div key={code} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${theme === 'dark' ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                      {code}
                      <button type="button" onClick={() => handleRemoveDiscount(code)} className="ml-1 hover:text-red-500"><FaTimes size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Order summary + Real-time Credit Breakdown + CRM Quote Button */}
        <div className={`w-80 flex flex-col border-l ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`px-5 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`font-bold italic text-base ${text}`}>Descripción</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {cart.map(({ item, qty }) => {
              const unitLbl = getUnitLabel(item);
              const sub = calcExactSubtotal(qty, item.precio);
              return (
                <div key={item.id} className={`px-3 py-2 rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <p className={`text-xs font-bold uppercase truncate ${text}`}>{item.nombre}</p>
                  {item.varianteId && (
                    <p className="text-[10px] text-indigo-400 font-semibold">
                      Talla {item.varianteTalla} · {item.varianteColor}
                    </p>
                  )}
                  <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Cant. {qty} {unitLbl} &nbsp; Total. S/. {sub.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className={`border-t px-5 py-4 space-y-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between text-sm">
              <span className={`font-semibold uppercase ${text}`}>Subtotal</span>
              <span className={text}>S/. {subtotal.toFixed(2)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Descuento</span>
                <span className="text-green-400">−S/. {discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className={`font-semibold uppercase ${text}`}>Op. Gravada</span>
              <span className={text}>S/. {opGravada.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={`font-semibold uppercase ${text}`}>IGV ({igvRate}%)</span>
              <span className={text}>S/. {igvMonto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 border-dashed border-gray-400 dark:border-gray-600">
              <span className={text}>IMPORTE TOTAL</span>
              <span className={text}>S/. {total.toFixed(2)}</span>
            </div>

            {/* Real-time Credit Summary (Feature 4) */}
            {condicionPago === 'CREDITO' && (
              <div className={`mt-2 p-3 rounded-xl border text-xs space-y-1.5 ${
                theme === 'dark' ? 'bg-slate-900/70 border-slate-700' : 'bg-amber-50/70 border-amber-200'
              }`}>
                <div className="flex justify-between">
                  <span className={ds.muted}>Total Comprobante:</span>
                  <span className={`font-bold ${text}`}>S/. {creditSummary.totalComprobante.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-500 font-semibold">
                    Adelanto Pagado Hoy (entra a Caja{usarAdelanto && creditSummary.adelantoPagadoHoy > 0 ? ` · ${adelantoMetodo}` : ''}):
                  </span>
                  <span className="font-bold text-emerald-500">S/. {creditSummary.adelantoPagadoHoy.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 border-dashed border-slate-600/40">
                  <span className="text-amber-500 font-bold">Saldo Pendiente a Crédito (va a CxC):</span>
                  <span className="font-extrabold text-amber-500">S/. {creditSummary.saldoPendienteCredito.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              {saleType === 'Cotizar' ? (
                <button type="button" onClick={handleCotizar}
                  className="w-full py-3 bg-gray-700 hover:bg-yellow-500 hover:text-black text-white font-bold rounded-full text-sm flex items-center justify-center gap-2 transition-colors duration-300 cursor-pointer">
                  COTIZAR
                </button>
              ) : (
                <button type="button" onClick={proceed}
                  className="w-full py-3 bg-gray-700 hover:bg-yellow-500 hover:text-black text-white font-bold rounded-full text-sm flex items-center justify-center gap-2 transition-colors duration-300 cursor-pointer">
                  IR A PAGAR <FaArrowLeft className="rotate-180" />
                </button>
              )}

              {/* Feature 5: Botón secundario "Guardar como Cotización en CRM" */}
              <Btn
                type="button"
                variant="secondary"
                className="w-full rounded-full"
                onClick={handleSaveAsQuoteToCRM}
              >
                <FaPaperPlane className="text-xs" /> Guardar como Cotización en CRM
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   STEP 3 – Payment methods (full flow)
───────────────────────────────────────────────────────────────── */

// Ticket HTML generator — opens in new tab and auto-prints
const TIPO_PREFIX = { Ticket: 'NV01', Boleta: 'B001', Factura: 'F001', Cotizar: 'COT' };
const genSaleId = (tipo) => `${TIPO_PREFIX[tipo] || 'TKT'}-${Date.now().toString().slice(-8)}`;

const buildTicketHTML = (empresa, cart, saleData, payMethod, saleId, vendedor) => {
  const date = new Date().toLocaleString('es-PE');
  const rows = cart.map(({ item, qty }) => `
    <tr>
      <td>${item.nombre}</td>
      <td style="text-align:center">${qty} ${getUnitLabel(item)}</td>
      <td style="text-align:right">S/. ${parseFloat(item.precio || 0).toFixed(2)}</td>
      <td style="text-align:right">S/. ${calcExactSubtotal(qty, item.precio).toFixed(2)}</td>
    </tr>`).join('');
  const adelantoAmt = Number(saleData?.adelanto_monto || 0);
  const saldoPend = Number(saleData?.saldo_pendiente ?? Math.max(0, (saleData?.total || 0) - adelantoAmt));
  const payLabel = {
    digital: 'Billetera electrónica',
    bank: 'Transferencia / CCI',
    cash: 'Efectivo',
    pos: 'POS',
    credit: `Crédito (Vence: ${saleData?.fecha_vencimiento || '—'}${adelantoAmt > 0 ? ` · Adelanto S/ ${adelantoAmt.toFixed(2)} (${saleData?.adelanto_metodo || 'Efectivo'})` : ''})`,
  }[payMethod] || payMethod || '—';
  const clientName = saleData?.client ? `${saleData.client.nombre} ${saleData.client.apellidos}` : 'Consumidor final';
  
  const igvPct = 18;
  const subtotal = saleData?.subtotal || 0;
  const dscAmt = saleData?.discountAmt || 0;
  const total = saleData?.total || 0;
  const opGravada = total / (1 + (igvPct / 100));
  const igvMonto = total - opGravada;

  let discountHtml = '';
  if (dscAmt > 0) {
    const pctLabel = (saleData?.discount > 0 && saleData?.discount < 1) ? ` (${(saleData.discount * 100).toFixed(0)}%)` : '';
    discountHtml = `<tr><td colspan="3" style="text-align:right">Descuento${pctLabel}</td><td style="text-align:right;color:green">-S/. ${dscAmt.toFixed(2)}</td></tr>`;
  }

  let creditExtraHtml = '';
  if (saleData?.condicion_pago === 'CREDITO') {
    creditExtraHtml = `
      <tr><td colspan="3" style="text-align:right">Adelanto Pagado Hoy (${saleData?.adelanto_metodo || 'Efectivo'})</td><td style="text-align:right">S/. ${adelantoAmt.toFixed(2)}</td></tr>
      <tr><td colspan="3" style="text-align:right;font-weight:bold">Saldo Pendiente a Crédito</td><td style="text-align:right;font-weight:bold">S/. ${saldoPend.toFixed(2)}</td></tr>
    `;
  }

  const logoTag = empresa?.logoPath
    ? `<div style="text-align:center;margin-bottom:8px"><img src="${empresa.logoPath}" alt="logo" style="max-height:70px;max-width:200px;object-fit:contain" /></div>`
    : '';

  return `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8">
    <title>${empresa?.razonSocial || 'ERSOFT'} - Comprobante</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Courier New', monospace; font-size:12px; max-width:320px; margin:0 auto; padding:20px; }
      h1 { font-size:18px; text-align:center; margin-bottom:4px; }
      .center { text-align:center; }
      .divider { border-top: 1px dashed #000; margin: 8px 0; }
      table { width:100%; border-collapse:collapse; margin-top:6px; }
      th { border-bottom: 1px solid #000; padding: 4px 2px; text-align:left; font-size:11px; }
      td { padding: 3px 2px; font-size:11px; }
      .total-row td { font-weight:bold; border-top:1px solid #000; }
      .footer { margin-top:16px; text-align:center; font-size:10px; }
      @media print { .no-print { display:none; } }
    </style>
  </head><body>
    ${logoTag}
    <h1>${empresa?.razonSocial || 'ERSOFT'}</h1>
    <p class="center">${empresa?.tipoDocumento || 'RUC'}: ${empresa?.ruc || '—'}</p>
    <p class="center">${empresa?.direccion || ''}${empresa?.ciudad ? ', ' + empresa.ciudad : ''}</p>
    <p class="center">Tel: ${empresa?.telefono || '—'}</p>
    <div class="divider"></div>
    <p class="center"><strong>N° Comprobante:</strong> ${saleId || 'N/D'}</p>
    <p><strong>Comprobante:</strong> ${saleData?.saleType || 'Ticket'}</p>
    <p><strong>Fecha:</strong> ${date}</p>
    <p><strong>Atención:</strong> ${vendedor}</p>
    <p><strong>Cliente:</strong> ${clientName}</p>
    <p><strong>Pago:</strong> ${payLabel}</p>
    <div class="divider"></div>
    <table>
      <thead><tr><th>Descripción</th><th>Cant.</th><th>P. Unit.</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="3" style="text-align:right">Subtotal</td><td style="text-align:right">S/. ${subtotal.toFixed(2)}</td></tr>
        ${discountHtml}
        <tr><td colspan="3" style="text-align:right">Op. Gravada</td><td style="text-align:right">S/. ${opGravada.toFixed(2)}</td></tr>
        <tr><td colspan="3" style="text-align:right">IGV (${igvPct}%)</td><td style="text-align:right">S/. ${igvMonto.toFixed(2)}</td></tr>
        <tr class="total-row"><td colspan="3" style="text-align:right">IMPORTE TOTAL</td><td style="text-align:right">S/. ${total.toFixed(2)}</td></tr>
        ${creditExtraHtml}
      </tfoot>
    </table>
    <div class="footer">
      <div class="divider"></div>
      <p>¡Gracias por su compra!</p>
      <p>®ERSOFT - Todos los derechos reservados</p>
    </div>
    <script>window.onload = () => { window.print(); }</script>
  </body></html>`;
};

const buildProformaHTML = (empresa, cart, saleData, vendedor) => {
  const date = new Date().toLocaleDateString('es-PE');
  // Optional plus 15 days validity logic could go here
  const due = new Date(Date.now() + 15 * 86400000).toLocaleDateString('es-PE'); 
  
  const clientName = saleData?.client && (saleData.client.nombre || saleData.client.apellidos) 
    ? `${saleData.client.nombre} ${saleData.client.apellidos}` 
    : 'Consumidor final';
  const clientDoc = saleData?.client?.documento || 'No especificado';
  const clientTel = saleData?.client?.telefono || 'No especificado';
  const clientEmail = saleData?.client?.correo || 'No especificado';
  
  const igvPct = 18;
  const subtotal = saleData?.subtotal || 0;
  const dscAmt = saleData?.discountAmt || (saleData?.discount ? subtotal * saleData.discount : 0);
  const total = saleData?.total || 0;
  const opGravada = total / (1 + (igvPct / 100));
  const igvMonto = total - opGravada;

  let qrSrc = '';
  try {
    const saved = localStorage.getItem('ersoft_metodos_pago');
    if (saved) {
      const metodos = JSON.parse(saved);
      const dig = metodos.find(m => m.id === 'digital');
      if (dig && dig.qrPath) {
        qrSrc = dig.qrPath;
      }
    }
  } catch {
    qrSrc = '';
  }

  const qrTag = qrSrc
    ? `<img src="${qrSrc}" alt="QR" class="w-32 h-32 object-contain ml-4 rounded-lg shadow-sm border border-gray-100" />`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Proforma - ${empresa?.razonSocial || 'ERSOFT'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #f3f4f6; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: ui-sans-serif, system-ui, sans-serif; }
    .doc-container { width: 210mm; min-height: 297mm; background: white; margin: 2rem auto; padding: 25mm 20mm; position: relative; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); display: flex; flex-direction: column; }
    
    @media print {
      body { background-color: #ffffff; margin: 0; }
      .no-print { display: none !important; }
      .doc-container { margin: 0 !important; box-shadow: none !important; width: 100% !important; min-height: 100vh !important; padding: 0 !important; display: flex; flex-direction: column; }
      @page { size: A4; margin: 15mm; }
    }
    
    .print-text-control { word-break: break-all; overflow-wrap: break-word; line-height: 1.2; }
  </style>
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 800);
    };
  </script>
</head>
<body class="text-gray-900">
  
  <div class="doc-container">
    <!-- Decoración Superior -->
    <div class="absolute top-0 left-0 w-full h-2 flex print:hidden">
      <div class="w-1/3 bg-black"></div>
      <div class="w-2/3 bg-yellow-400"></div>
    </div>

    <!-- Header -->
    <div class="flex justify-between items-start pt-2 pb-4">
      <div class="w-[55%]">
        <div class="flex items-center gap-3 mb-2">
          ${empresa?.logoPath ? `<img src="${empresa.logoPath}" alt="Logo" class="h-12 object-contain" />` : ''}
          <div>
            <h1 class="text-xl font-black tracking-tight uppercase leading-none">${empresa?.razonSocial || 'ERSOFT'}</h1>
            <p class="text-[10px] mt-0.5 font-bold text-gray-600 uppercase tracking-wide">${empresa?.tipoDocumento || 'RUC'}: ${empresa?.ruc || '—'}</p>
          </div>
        </div>
        <div class="text-[9px] text-gray-600 flex flex-col gap-1">
          <div class="flex items-start gap-1.5">
            <svg class="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
            <span class="leading-tight">${empresa?.direccion || 'Dirección no especificada'}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <svg class="w-3 h-3 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
            <span>${empresa?.telefono || 'Teléfono no especificado'}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <svg class="w-3 h-3 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
            <span>${empresa?.email || 'Email no especificado'}</span>
          </div>
        </div>
      </div>
      
      <div class="text-right w-[45%] flex flex-col items-end">
        <h2 class="text-3xl leading-none font-extrabold tracking-tight text-gray-900 uppercase">Proforma</h2>
        
        <table class="mt-3 text-[10px] text-left w-56 border-spacing-y-1 border-separate">
          <tr>
            <td class="font-bold text-gray-800 pb-0.5">Fecha Emisión:</td>
            <td class="text-right pb-0.5">${date}</td>
          </tr>
          <tr>
            <td class="font-bold text-gray-800 pb-0.5">Fecha Válidez:</td>
            <td class="text-right pb-0.5">${due}</td>
          </tr>
          <tr>
            <td class="font-bold text-gray-800 pb-0.5">Moneda:</td>
            <td class="text-right pb-0.5">Soles (PEN)</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Client Box -->
    <div class="mt-4">
      <div class="bg-black text-white px-3 py-1.5 rounded-t-md">
        <h3 class="font-bold tracking-widest text-[10px] text-yellow-400">DATOS DEL CLIENTE</h3>
      </div>
      <div class="border border-gray-900 border-t-0 rounded-b-md px-3 py-2">
        <table class="w-full text-[10px] table-fixed">
          <tr>
            <td class="w-[12%] font-bold text-gray-800 align-top py-0.5">Cliente:</td>
            <td class="w-[38%] text-gray-800 font-medium align-top pr-2 print-text-control py-0.5">${clientName}</td>
            <td class="w-[15%] font-bold text-gray-800 align-top py-0.5">Documento:</td>
            <td class="w-[35%] text-gray-800 align-top break-all py-0.5">${clientDoc}</td>
          </tr>
          <tr>
            <td class="font-bold text-gray-800 align-top py-0.5">Teléfono:</td>
            <td class="text-gray-800 align-top pr-2 py-0.5 print-text-control">${clientTel}</td>
            <td class="font-bold text-gray-800 align-top py-0.5">Correo:</td>
            <td class="text-gray-800 align-top print-text-control py-0.5">${clientEmail}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Items Table -->
    <div class="mt-5 flex-1 w-full">
      <table class="w-full text-left border-collapse text-[10px] table-auto">
        <thead class="bg-black text-white border-b-2 border-yellow-400">
          <tr>
            <th class="py-1.5 px-2 font-semibold text-center w-[8%]">Item</th>
            <th class="py-1.5 px-2 font-semibold w-[50%]">Descripción</th>
            <th class="py-1.5 px-2 font-semibold text-center w-[10%]">Cant.</th>
            <th class="py-1.5 px-2 font-semibold text-right w-[15%]">V. Unit.</th>
            <th class="py-1.5 px-2 font-semibold text-right w-[17%] text-yellow-400">V. Total</th>
          </tr>
        </thead>
        <tbody>
          ${cart.map(({ item, qty }, idx) => `
            <tr class="border-b border-gray-200">
              <td class="py-1.5 px-2 text-center text-gray-600">(${idx + 1})</td>
              <td class="py-1.5 px-2 text-gray-900 font-medium break-all pr-2">${item.nombre}</td>
              <td class="py-1.5 px-2 text-center text-gray-900">${qty} ${getUnitLabel(item)}</td>
              <td class="py-1.5 px-2 text-right text-gray-900 whitespace-nowrap">S/. ${parseFloat(item.precio || 0).toFixed(2)}</td>
              <td class="py-1.5 px-2 text-right text-gray-900 whitespace-nowrap font-medium">S/. ${calcExactSubtotal(qty, item.precio).toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals Area -->
    <div class="flex justify-end mt-4 break-inside-avoid w-full">
      <div class="w-64 border border-gray-900 p-3 rounded-md">
        <table class="w-full text-[10px] text-gray-700">
          <tr>
            <td class="py-1">Atención:</td>
            <td class="text-right font-semibold text-gray-900 whitespace-nowrap">${vendedor}</td>
          </tr>
          <tr>
            <td class="py-1">Subtotal:</td>
            <td class="text-right font-semibold text-gray-900 whitespace-nowrap">S/. ${subtotal.toFixed(2)}</td>
          </tr>
          ${(dscAmt > 0) ? `<tr><td class="py-1">${(saleData?.discount > 0 && saleData?.discount < 1) ? `Descuento (${(saleData.discount * 100).toFixed(0)}%)` : 'Descuento'}:</td><td class="text-right text-red-600 font-semibold whitespace-nowrap">-S/. ${dscAmt.toFixed(2)}</td></tr>` : ''}
          <tr>
            <td class="py-1">Op. Gravada:</td>
            <td class="text-right font-semibold text-gray-900 whitespace-nowrap">S/. ${opGravada.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="py-1">IGV (${igvPct}%):</td>
            <td class="text-right font-semibold text-gray-900 whitespace-nowrap">S/. ${igvMonto.toFixed(2)}</td>
          </tr>
        </table>
        <div class="border-t-2 border-black mt-2 pt-2 flex justify-between items-center">
          <span class="font-black text-xs text-gray-900 uppercase tracking-widest">TOTAL</span>
          <span class="font-black text-[14px] text-green-700 whitespace-nowrap">S/. ${total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Footer Area -->
    <div class="mt-auto pt-6 flex border-t border-gray-900 items-end justify-between break-inside-avoid w-full">
      <div class="w-[70%] pr-4 text-[8.5px] text-gray-600 text-justify leading-snug">
        <p class="font-bold text-gray-900 mb-0.5 uppercase tracking-wide">Términos y Condiciones:</p>
        <p>1. Esta proforma tiene una validez de 15 días calendario a partir de su emisión.</p>
        <p>2. Precios en Soles (PEN), sujetos a variación sin previo aviso cumplido el plazo.</p>
        <p>3. Documento exclusivamente informartivo sin validez fiscal. Para facturar confirme su pedido.</p>
      </div>
      <div class="w-[30%] flex justify-end">
        <div class="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-300">
          <div class="text-[9px] font-bold text-gray-800 mb-1 uppercase tracking-tight">Escanear Pago</div>
          <div class="flex items-center">
              ${qrTag || '<div class="text-gray-400 italic text-[9px] py-4 text-center">Sin QR</div>'}
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const PAYMENT_METHODS = [
  { key: 'digital', label: 'Billetera electrónica', sub: 'Yape · Plin · izipay' },
  { key: 'bank',    label: 'Transferencia Bancaria o CCI', sub: '' },
  { key: 'cash',    label: 'En efectivo', sub: '' },
  { key: 'pos',     label: 'POS', sub: 'Tarjeta de crédito / débito' },
];

const StepPago = ({ saleData, cart, onBack, theme, pageBg }) => {
  const ds = useDS();
  const { can } = usePermission();
  const { registrarVenta, refreshFinanzas, assertCanOperatePOS } = useFinanzas();
  const { addOportunidad, addSeguimiento } = useCRM();
  const [saleError, setSaleError] = useState('');
  const [crmQuoteFeedback, setCrmQuoteFeedback] = useState(null);
  const savedRef = useRef(false);
  const navigate = useNavigate();
  const { productos, servicios, lotes, almacenes, bulkUpdateStock, addKardexMovimiento, refreshData } = useInventario();
  const { empresa } = useEmpresa();
  const { user } = useAuth();

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [metodosPago] = useState(() => {
    const saved = localStorage.getItem('ersoft_metodos_pago');
    return saved ? JSON.parse(saved) : [
      { id: 'cash', activo: true },
      { id: 'digital', activo: true },
      { id: 'bank', activo: true },
      { id: 'pos', activo: true }
    ];
  });
  const [showQrModal, setShowQrModal]   = useState(false);
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [showPhoneModal, setShowPhoneModal]   = useState(false);
  const [phone, setPhone] = useState('');
  const [warnNoTicket, setWarnNoTicket] = useState(false);
  const [montoRecibido, setMontoRecibido] = useState('');
  // Guard: ensures comprobante is saved only once per sale
  const saleIdRef = useRef(null);
  const getSaleId = () => {
    if (!saleIdRef.current) saleIdRef.current = genSaleId(saleData?.saleType || 'Ticket');
    return saleIdRef.current;
  };

  const creditSummary = calculateCreditSummary(
    saleData?.total || 0,
    saleData?.condicion_pago === 'CREDITO' ? Number(saleData?.adelanto_monto || 0) : 0
  );

  // Feature 5: Guardar como Cotización en CRM (Etapa COTIZADO + alerta en Calendario)
  const handleSaveAsQuoteToCRM = () => {
    setSaleError('');
    setCrmQuoteFeedback(null);
    const candidateClient = saleData?.client || null;
    const validationErr = validateQuoteForCRM({ client: candidateClient, cart });
    if (validationErr) {
      setSaleError(validationErr);
      return;
    }

    const clienteNombreCompleto = `${candidateClient.nombre || candidateClient.name || ''} ${candidateClient.apellidos || candidateClient.surname || ''}`.trim();
    const followUpDate = todayLima();
    const itemsCotizados = cart.map(({ item, qty }) => ({
      id: item.parentProductId ?? item.id,
      varianteId: item.varianteId || null,
      varianteTalla: item.varianteTalla || null,
      varianteColor: item.varianteColor || null,
      nombre: item.nombre,
      precio: Number(item.precio || 0),
      qty: Number(qty || 1),
      cantidad: Number(qty || 1),
      unidad_medida: getUnitLabel(item),
      permite_decimales: allowsDecimals(item),
      subtotal: calcExactSubtotal(qty, item.precio),
      tipo: item._type === 'Servicio' ? 'SERVICIO' : 'PRODUCTO',
      _type: item._type || 'Producto',
    }));

    const resumenItems = itemsCotizados
      .map(it => `${it.nombre} x${it.qty} ${it.unidad_medida} (S/ ${it.subtotal.toFixed(2)})`)
      .join(', ');

    const effectiveDoc = (candidateClient.documento || candidateClient.docNumber || '').trim();
    const nuevaOp = addOportunidad({
      sucursal_id: String(saleData?.sucursalId || '1'),
      sucursalId: String(saleData?.sucursalId || '1'),
      titulo_pedido: `Cotización POS (${saleData?.saleType || 'Ticket'}) - ${clienteNombreCompleto}`,
      cliente_nombre: clienteNombreCompleto,
      tipo_documento: candidateClient.docType || 'DNI',
      documento: effectiveDoc,
      cliente_documento: effectiveDoc,
      telefono: (candidateClient.telefono || '').trim(),
      cliente_telefono: (candidateClient.telefono || '').trim(),
      correo: (candidateClient.correo || '').trim(),
      cliente_correo: (candidateClient.correo || '').trim(),
      etapa: 'COTIZADO',
      monto_estimado: Number((saleData?.total || 0).toFixed(2)),
      items_cotizados: itemsCotizados,
      fecha_proximo_contacto: followUpDate,
      origen: 'POS_COTIZACION',
    });

    if (nuevaOp?.oportunidad_id) {
      addSeguimiento({
        oportunidad_id: nuevaOp.oportunidad_id,
        fecha_proximo_contacto: followUpDate,
        realizado: false,
        detalle_conversacion: `Cotización enviada desde POS (${saleData?.saleType || 'Ticket'}) por S/ ${(saleData?.total || 0).toFixed(2)}. Detalle: ${resumenItems}`,
      });
    }

    setCrmQuoteFeedback({
      oportunidadId: nuevaOp?.oportunidad_id,
      cliente: clienteNombreCompleto,
      total: (saleData?.total || 0).toFixed(2),
      fechaAlerta: followUpDate,
    });
  };

  const handleDupPantalla = () => {
    const popup = window.open('', '_blank', 'width=600,height=700');
    if (popup) {
      const qrSrc = metodosPago.find(m => m.id === 'digital')?.qrPath || '';
      const totalVal = (saleData?.total || 0).toFixed(2);
      const razonSocial = empresa?.razonSocial || 'ERSOFT';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Pago QR - ${razonSocial}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              background: #0f172a;
              color: #f8fafc;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background: #1e293b;
              border-radius: 24px;
              padding: 32px;
              box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3);
              text-align: center;
              max-width: 400px;
              width: 100%;
              border: 1px solid #334155;
            }
            .title {
              font-size: 20px;
              font-weight: 800;
              margin-bottom: 8px;
              color: #fbbf24;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .subtitle {
              font-size: 14px;
              color: #94a3b8;
              margin-bottom: 24px;
            }
            .qr-container {
              background: #ffffff;
              border-radius: 16px;
              padding: 16px;
              margin: 0 auto 24px;
              width: 256px;
              height: 256px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.06);
            }
            .qr-img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .amount-label {
              font-size: 14px;
              color: #94a3b8;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .amount-val {
              font-size: 32px;
              font-weight: 900;
              color: #f8fafc;
              margin-bottom: 24px;
            }
            .badges {
              display: flex;
              justify-content: center;
              gap: 16px;
            }
            .badge {
              font-weight: 900;
              padding: 8px 16px;
              border-radius: 12px;
              font-size: 14px;
              text-transform: uppercase;
            }
            .yape {
              background: #7022f3;
              color: #ffffff;
            }
            .plin {
              background: #00c896;
              color: #ffffff;
            }
            .no-qr {
              color: #64748b;
              font-size: 14px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">${razonSocial}</div>
            <div class="subtitle">Escanea el código para realizar tu pago</div>
            <div class="qr-container">
              ${qrSrc ? `<img class="qr-img" src="${qrSrc}" alt="QR Pago" />` : '<div class="no-qr">Sin código QR disponible</div>'}
            </div>
            <div class="amount-label">Monto a pagar</div>
            <div class="amount-val">S/. ${totalVal}</div>
            <div class="badges">
              <span class="badge yape">Yape</span>
              <span class="badge plin">Plin</span>
            </div>
          </div>
        </body>
        </html>
      `;
      popup.document.write(htmlContent);
      popup.document.close();
    }
  };

  // Supports both direct products/services and variant child items (via parentProductId)
  const findCatalogItem = (item) => {
    const isService = item._type === 'Servicio';
    const list = isService ? servicios : productos;
    const lookupId = item.parentProductId ?? item.id;
    const byId = list.find(p => String(p.id) === String(lookupId));
    if (byId) return byId;
    const targetName = (item.nombreBase || item.nombre || '').trim().toLowerCase();
    return list.find(p => p.nombre?.trim().toLowerCase() === targetName && (
      isService
        ? String(p.sucursalId || '1') === String(saleData.sucursalId)
        : String(almacenes.find(a => String(a.id) === String(lotes.find(l => String(l.id) === String(p.loteId))?.almacenId))?.sucursalId) === String(saleData.sucursalId)
    ));
  };

  // Feature 4 helper: Persist credit advance (adelanto) into active Caja session and update CxC balance/status
  const applyCreditAdvanceAndCxC = (saleId, totalVal) => {
    if (saleData?.condicion_pago !== 'CREDITO') return;
    const { adelantoPagadoHoy, saldoPendienteCredito, estadoCuenta } = calculateCreditSummary(
      totalVal,
      Number(saleData?.adelanto_monto || 0)
    );
    const metodoAdelanto = saleData?.adelanto_metodo || 'Efectivo';

    // 1. Update Cuenta por Cobrar in ersoft_cuentas_cobrar_pagar so it reflects ONLY the pending balance
    //    and state PARCIAL (if adelanto > 0) or PENDIENTE (if adelanto === 0)
    try {
      const rawCuentas = JSON.parse(localStorage.getItem('ersoft_cuentas_cobrar_pagar') || '[]');
      const nowIso = new Date().toISOString();
      const updatedCuentas = rawCuentas.map(c => {
        if (String(c.comprobante_referencia) !== String(saleId)) return c;
        const abonoInicial = adelantoPagadoHoy > 0
          ? [{
              abono_id: `abn-init-${Date.now()}`,
              fecha: nowIso,
              monto: adelantoPagadoHoy,
              metodo_pago: metodoAdelanto,
              tipo: 'ADELANTO_INICIAL',
              registrado_por: user?.name || user?.username || 'Cajero POS',
            }]
          : [];
        return {
          ...c,
          monto_total: Number(totalVal.toFixed(2)),
          monto_pagado: adelantoPagadoHoy,
          saldo_pendiente: saldoPendienteCredito,
          estado: estadoCuenta,
          abonos: abonoInicial,
        };
      });
      localStorage.setItem('ersoft_cuentas_cobrar_pagar', JSON.stringify(updatedCuentas));
    } catch (e) {
      console.error('Error actualizando Cuenta por Cobrar con adelanto:', e);
    }

    // 2. If adelantoPagadoHoy > 0, add it to the active Caja session according to payment method
    if (adelantoPagadoHoy > 0) {
      try {
        const rawSesiones = JSON.parse(localStorage.getItem('ersoft_caja_sesiones') || '[]');
        const updatedSesiones = rawSesiones.map(s => {
          const isOpen = ['ABIERTA', 'Abierto'].includes(String(s.estado || ''));
          if (!isOpen || String(s.sucursalId || '1') !== String(saleData.sucursalId || '1')) return s;

          const nextSession = { ...s };
          if (metodoAdelanto === 'Efectivo') {
            nextSession.efectivoVentas = Number(((Number(s.efectivoVentas) || 0) + adelantoPagadoHoy).toFixed(2));
          } else if (metodoAdelanto === 'Yape/Plin') {
            nextSession.yapePlinVentas = Number(((Number(s.yapePlinVentas) || 0) + adelantoPagadoHoy).toFixed(2));
          } else if (metodoAdelanto === 'Tarjeta') {
            nextSession.tarjetaVentas = Number(((Number(s.tarjetaVentas) || 0) + adelantoPagadoHoy).toFixed(2));
          } else if (metodoAdelanto === 'Transferencia') {
            nextSession.transferenciaVentas = Number(((Number(s.transferenciaVentas) || 0) + adelantoPagadoHoy).toFixed(2));
          }

          const ingresosPorMetodo = { ...(s.ingresosPorMetodo || {}) };
          ingresosPorMetodo[metodoAdelanto] = Number(((Number(ingresosPorMetodo[metodoAdelanto]) || 0) + adelantoPagadoHoy).toFixed(2));
          nextSession.ingresosPorMetodo = ingresosPorMetodo;

          const movimientosCaja = Array.isArray(s.movimientosCaja) ? [...s.movimientosCaja] : [];
          movimientosCaja.push({
            id: `mov-adelanto-${Date.now()}`,
            fecha: new Date().toISOString(),
            tipo: 'INGRESO_ADELANTO_CREDITO',
            comprobanteId: saleId,
            metodoPago: metodoAdelanto,
            monto: adelantoPagadoHoy,
            glosa: `Adelanto de venta a crédito ${saleId} (${metodoAdelanto})`,
          });
          nextSession.movimientosCaja = movimientosCaja;

          return nextSession;
        });
        localStorage.setItem('ersoft_caja_sesiones', JSON.stringify(updatedSesiones));
      } catch (e) {
        console.error('Error sumando adelanto a sesión de Caja:', e);
      }
    }

    if (typeof refreshFinanzas === 'function') {
      refreshFinanzas();
    }
  };

  const saveComprobante = () => {
    if (savedRef.current) return true;
    if (!can('ventas_caja', 'CREAR')) { setSaleError('No tienes permiso para emitir ventas.'); return false; }
    try { assertCanOperatePOS(saleData.sucursalId); } catch (error) { setSaleError(error.message); return false; }
    const validation = validateSale(saleData, empresa.modo_facturacion || 'INTERNO_PRE_FORMALIZACION');
    if (validation) { setSaleError(validation); return false; }
    const required = new Map();
    const requiredVariants = new Map();
    for (const { item, qty } of cart) {
      const isService = item._type === 'Servicio';
      const found = findCatalogItem(item);
      if (!found && item._fromCRM) {
        if (!(qty > 0) || String(item._crmSucursalId || saleData.sucursalId) !== String(saleData.sucursalId)) {
          setSaleError(`Revisa el ítem ${item.nombre}: no corresponde al catálogo de esta sucursal.`); return false;
        }
        continue;
      }
      const lot = lotes.find(l => String(l.id) === String(found?.loteId));
      const warehouse = almacenes.find(a => String(a.id) === String(lot?.almacenId));
      const branch = isService ? found?.sucursalId || '1' : warehouse?.sucursalId;
      if (!found || String(branch) !== String(saleData.sucursalId) || !(qty > 0)) {
        setSaleError(`Revisa el ítem ${item.nombre}: no corresponde al catálogo de esta sucursal.`); return false;
      }
      if (!isService) {
        const needed = Number(((required.get(found.id) || 0) + qty).toFixed(3));
        required.set(found.id, needed);
        if (needed > Number(found.stock || 0)) { setSaleError(`Stock insuficiente: ${item.nombre}.`); return false; }
        if (item.varianteId && Array.isArray(found.variantes)) {
          const targetVar = found.variantes.find(v => String(v.id) === String(item.varianteId));
          const varNeeded = Number(((requiredVariants.get(item.varianteId) || 0) + qty).toFixed(3));
          requiredVariants.set(item.varianteId, varNeeded);
          if (!targetVar || varNeeded > Number(targetVar.stock || 0)) {
            setSaleError(`Stock insuficiente en la variante seleccionada: ${item.nombre}.`); return false;
          }
        }
      }
    }
    if (!cart.length) { setSaleError('El carrito está vacío.'); return false; }
    if (saleData.condicion_pago !== 'CREDITO' && (!selectedMethod || (selectedMethod === 'cash' && Number(montoRecibido) < saleData.total))) {
      setSaleError('Selecciona el medio de pago y completa el efectivo recibido.'); return false;
    }
    const saleId = getSaleId();
    const igvPct = 18;
    const totalVal = Number((saleData?.total || 0).toFixed(2));
    const opGravadaVal = totalVal / (1 + (igvPct / 100));
    const igvMontoVal = totalVal - opGravadaVal;

    const record = {
      id: saleId,
      tipo: saleData?.saleType || 'Ticket',
      fecha: new Date().toISOString(),
      estado: 'Activo',
      sucursalId: saleData.sucursalId,
      condicion_pago: saleData.condicion_pago,
      fecha_vencimiento: saleData.fecha_vencimiento,
      adelanto_monto: saleData.condicion_pago === 'CREDITO' ? creditSummary.adelantoPagadoHoy : 0,
      adelanto_metodo: saleData.condicion_pago === 'CREDITO' && creditSummary.adelantoPagadoHoy > 0 ? (saleData.adelanto_metodo || 'Efectivo') : null,
      saldo_pendiente: saleData.condicion_pago === 'CREDITO' ? creditSummary.saldoPendienteCredito : 0,
      modo_facturacion: empresa.modo_facturacion || 'INTERNO_PRE_FORMALIZACION',
      cliente: saleData?.client || null,
      vendedor: user?.name || user?.username || 'Vendedor',
      items: cart.map(({ item, qty }) => {
        const found = findCatalogItem(item);
        return {
          id: found?.id ?? item.id,
          varianteId: item.varianteId || null,
          varianteTalla: item.varianteTalla || null,
          varianteColor: item.varianteColor || null,
          nombre: item.nombre,
          precio: parseFloat(item.precio || 0),
          qty,
          unidad_medida: getUnitLabel(item),
          permite_decimales: allowsDecimals(item),
          subtotal: calcExactSubtotal(qty, item.precio),
          _type: item._type,
          tipo: item._type,
          costo: Number(found?.costo ?? item.costo ?? 0),
        };
      }),
      total: totalVal,
      subtotal: saleData?.subtotal || 0,
      discount: saleData?.discount || 0,
      discountAmt: saleData?.discountAmt || 0,
      opGravada: opGravadaVal,
      igvMonto: igvMontoVal,
      igvRate: igvPct,
      metodoPago: saleData.condicion_pago === 'CREDITO' ? 'credit' : selectedMethod,
      empresa: empresa ? {
        razonSocial: empresa.razonSocial,
        tipoDocumento: empresa.tipoDocumento,
        ruc: empresa.ruc,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        pieFactura: empresa.pieFactura,
        logoPath: empresa.logoPath || null,
      } : null,
    };
    try {
      const created = registrarVenta(record);
      if (created) {
        if (saleData.condicion_pago === 'CREDITO') {
          applyCreditAdvanceAndCxC(saleId, totalVal);
        } else if (typeof refreshFinanzas === 'function') {
          // Sync cash sale to active Caja session as well
          try {
            const rawSesiones = JSON.parse(localStorage.getItem('ersoft_caja_sesiones') || '[]');
            const updatedSesiones = rawSesiones.map(s => {
              const isOpen = ['ABIERTA', 'Abierto'].includes(String(s.estado || ''));
              if (!isOpen || String(s.sucursalId || '1') !== String(saleData.sucursalId || '1')) return s;
              const nextSession = { ...s };
              if (selectedMethod === 'cash') {
                nextSession.efectivoVentas = Number(((Number(s.efectivoVentas) || 0) + totalVal).toFixed(2));
              } else if (selectedMethod === 'digital') {
                nextSession.yapePlinVentas = Number(((Number(s.yapePlinVentas) || 0) + totalVal).toFixed(2));
              } else if (selectedMethod === 'pos') {
                nextSession.tarjetaVentas = Number(((Number(s.tarjetaVentas) || 0) + totalVal).toFixed(2));
              } else if (selectedMethod === 'bank') {
                nextSession.transferenciaVentas = Number(((Number(s.transferenciaVentas) || 0) + totalVal).toFixed(2));
              }
              return nextSession;
            });
            localStorage.setItem('ersoft_caja_sesiones', JSON.stringify(updatedSesiones));
          } catch {
            // ignore storage errors
          }
          refreshFinanzas();
        }
        deductStock(saleId);
      }
      savedRef.current = true;
      return true;
    } catch (error) { setSaleError(error.message); return false; }
  };

  const text  = theme === 'dark' ? 'text-white'     : 'text-gray-900';
  const subTx = theme === 'dark' ? 'text-gray-400'  : 'text-gray-500';
  const cardIdle = theme === 'dark'
    ? 'border-gray-600 bg-gray-800 hover:border-gray-400'
    : 'border-gray-300 bg-white hover:border-gray-500';

  /* ── helpers: deduct stock (supports variants, decimals, ventas_acumuladas, and RN-05 Kardex) ── */
  const deductStock = (saleId) => {
    try {
      const savedProds = JSON.parse(localStorage.getItem('ersoft_productos') || '[]');
      const savedServs = JSON.parse(localStorage.getItem('ersoft_servicios') || '[]');
      let prodsModified = false;
      let servsModified = false;

      cart.forEach(({ item, qty }) => {
        const isService = item._type === 'Servicio';
        const found = findCatalogItem(item);
        if (!found) return;

        if (isService) {
          // RN-05: SERVICIO never touches kardex_movimiento or stock, only increments ventas_acumuladas
          const idx = savedServs.findIndex(s => String(s.id) === String(found.id));
          if (idx !== -1) {
            savedServs[idx] = {
              ...savedServs[idx],
              ventas_acumuladas: Number(((Number(savedServs[idx].ventas_acumuladas) || 0) + Number(qty || 0)).toFixed(3)),
            };
            servsModified = true;
          }
        } else {
          const idx = savedProds.findIndex(p => String(p.id) === String(found.id));
          if (idx !== -1) {
            const currentProd = savedProds[idx];
            const prevStock = Number(currentProd.stock || 0);
            const nextStock = Math.max(0, Number((prevStock - Number(qty || 0)).toFixed(3)));
            let nextVariantes = currentProd.variantes;
            if (item.varianteId && Array.isArray(currentProd.variantes)) {
              nextVariantes = currentProd.variantes.map(v => {
                if (String(v.id) !== String(item.varianteId)) return v;
                const vPrev = Number(v.stock || 0);
                return { ...v, stock: Math.max(0, Number((vPrev - Number(qty || 0)).toFixed(3))) };
              });
            }
            savedProds[idx] = {
              ...currentProd,
              stock: nextStock,
              variantes: nextVariantes,
              ventas_acumuladas: Number(((Number(currentProd.ventas_acumuladas) || 0) + Number(qty || 0)).toFixed(3)),
            };
            prodsModified = true;

            if (typeof addKardexMovimiento === 'function') {
              const lot = lotes.find(l => String(l.id) === String(currentProd.loteId));
              addKardexMovimiento({
                productoId: currentProd.id,
                productoNombre: item.nombre,
                almacenId: lot?.almacenId || '',
                loteId: currentProd.loteId || '',
                sucursalId: saleData?.sucursalId || '1',
                tipoMovimiento: 'VENTA',
                cantidad: Number(qty || 0),
                stockAnterior: prevStock,
                stockResultante: nextStock,
                costoUnitario: Number(currentProd.costo || 0),
                referenciaId: saleId,
                glosa: `Venta POS ${saleId}${item.varianteId ? ` (Talla ${item.varianteTalla} / ${item.varianteColor})` : ''}`,
              });
            }
          } else {
            bulkUpdateStock([{ id: found.id, delta: -qty }]);
          }
        }
      });

      if (prodsModified) localStorage.setItem('ersoft_productos', JSON.stringify(savedProds));
      if (servsModified) localStorage.setItem('ersoft_servicios', JSON.stringify(savedServs));
      if ((prodsModified || servsModified) && typeof refreshData === 'function') {
        refreshData();
      }
    } catch {
      const changes = cart
        .filter(({ item }) => item._type === 'Producto')
        .map(({ item, qty }) => {
          const found = findCatalogItem(item);
          return found ? { id: found.id, delta: -qty } : null;
        })
        .filter(Boolean);
      if (changes.length > 0) bulkUpdateStock(changes);
    }
  };

  const openTicket = () => {
    if (!saveComprobante()) return;
    const saleId = getSaleId();
    const effectiveMethod = saleData?.condicion_pago === 'CREDITO' ? 'credit' : selectedMethod;
    const html = buildTicketHTML(empresa, cart, saleData, effectiveMethod, saleId, user?.name || user?.username || 'Vendedor');
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    setTicketGenerated(true);
    setWarnNoTicket(false);
    setShowQrModal(false);
  };

  const handleFinalizar = () => {
    if (!ticketGenerated) { setWarnNoTicket(true); return; }
    window.location.replace('/ventas');
  };

  const handleSendWhatsApp = () => {
    if (!phone.trim()) return;
    if (!saveComprobante()) return;
    const clientName = saleData?.client ? `${saleData.client.nombre} ${saleData.client.apellidos}` : 'cliente';
    const items = cart.map(({ item, qty }) => `• ${item.nombre} x${qty} ${getUnitLabel(item)} = S/. ${calcExactSubtotal(qty, item.precio).toFixed(2)}`).join('%0A');
    const msg = `*Comprobante de compra - ${empresa?.razonSocial || 'ERSOFT'}*%0AFecha: ${new Date().toLocaleString('es-PE')}%0ACliente: ${clientName}%0A%0A${items}%0A%0A*TOTAL: S/. ${(saleData?.total || 0).toFixed(2)}*%0A%0AGracias por su compra.`;
    window.open(`https://wa.me/${phone.replace(/\D/g,'')}?text=${msg}`, '_blank');
    setShowPhoneModal(false);
    setTicketGenerated(true);
    setWarnNoTicket(false);
  };

  /* ── right panel content ── */
  const renderRightPanel = () => {
    if (ticketGenerated) return (
      <div className="text-center px-8 space-y-6">
        <p className={`text-sm italic ${subTx}`}>Pago confirmado, puedes revisar el ticket en TBF</p>
        <div className="text-5xl">😊</div>
        <button type="button" onClick={handleFinalizar}
          className="w-full py-3 bg-[#1a1a1a] hover:bg-gray-800 text-white font-bold rounded-full tracking-widest text-sm">
          FINALIZAR
        </button>
      </div>
    );
    if (warnNoTicket) return (
      <div className="text-center px-8 space-y-4">
        <p className={`text-sm italic ${subTx}`}>Todavía no se ha generado ningún ticket o comprobante, asegurate de generar comprobante...</p>
        <div className="text-4xl">⚠️</div>
      </div>
    );
    if (!selectedMethod) return (
      <div className="text-center px-8 space-y-4 w-full max-w-xs">
        <p className={`text-sm italic ${subTx}`}>Seleccione un medio de pago y confirme la operación</p>
        <div className="text-4xl opacity-40">🙂</div>
        <Btn
          type="button"
          variant="secondary"
          className="w-full rounded-full mt-2"
          onClick={handleSaveAsQuoteToCRM}
        >
          <FaPaperPlane className="text-xs" /> Guardar como Cotización en CRM
        </Btn>
      </div>
    );

    const isSelectedMethodActive = metodosPago.find(m => m.id === selectedMethod)?.activo !== false;
    if (!isSelectedMethodActive) {
      return (
        <div className="text-center px-8 space-y-6 w-full max-w-xs">
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl p-5 flex flex-col items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm font-bold uppercase tracking-wider text-red-500">Método de pago inhabilitado</p>
            <p className="text-xs text-red-400">Método de pago inhabilitado globalmente. Por favor, elija un método de pago activo.</p>
          </div>
          <p className={`text-xs ${subTx}`}>Por favor, seleccione un método de pago activo a la izquierda para proceder.</p>
        </div>
      );
    }

    const isCashInsufficient = selectedMethod === 'cash' && (!Number.isFinite(Number(montoRecibido)) || Number(montoRecibido) < saleData.total);

    return (
      <div className="text-center px-8 space-y-4 w-full max-w-sm">
        <p className={`text-sm italic text-center ${subTx}`}>
          Verifica que el pago se haya completado y se haya generado el comprobante o ticket
        </p>
        <div className="text-3xl">👀</div>
        <div className="space-y-2.5">
          {selectedMethod === 'digital' ? (
            <button type="button" onClick={() => setShowQrModal(true)}
              className="w-full py-3 bg-[#1a1a1a] hover:bg-gray-800 text-white font-bold rounded-full tracking-widest text-sm">
              GENERAR CODIGO QR
            </button>
          ) : (
            <button
              type="button"
              onClick={openTicket}
              disabled={isCashInsufficient}
              className={`w-full py-3 font-bold rounded-full tracking-widest text-sm transition-colors ${
                isCashInsufficient
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#1a1a1a] hover:bg-gray-800 text-white'
              }`}
            >
              GENERAR TICKET
            </button>
          )}

          {/* Feature 5: Botón secundario "Guardar como Cotización en CRM" junto al botón de emitir comprobante */}
          <Btn
            type="button"
            variant="secondary"
            className="w-full rounded-full"
            onClick={handleSaveAsQuoteToCRM}
          >
            <FaPaperPlane className="text-xs" /> Guardar como Cotización en CRM
          </Btn>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col flex-1 -m-6 ${pageBg}`}>
      <PageHeader onBack={() => navigate('/principal')} />
      {saleError && <p role="alert" className="px-8 py-3 text-sm text-red-400">{saleError}</p>}

      {crmQuoteFeedback && (
        <div className="px-6 pt-4">
          <Card className="border-emerald-500/40 bg-emerald-500/10 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                <FaCheckCircle />
                <span>Cotización guardada en CRM (Etapa: COTIZADO)</span>
              </div>
              <Badge color="green" size="sm">Seguimiento en Calendario: {crmQuoteFeedback.fechaAlerta}</Badge>
            </div>
            <p className={`text-xs ${ds.text}`}>
              Cliente: <strong>{crmQuoteFeedback.cliente}</strong> · Monto estimado: <strong>S/ {crmQuoteFeedback.total}</strong> · Alerta creada en el Calendario Operativo.
            </p>
            <div className="flex gap-2 pt-1">
              <Btn type="button" size="sm" variant="secondary" onClick={() => navigate('/crm')}>
                Ver en CRM
              </Btn>
              <Btn type="button" size="sm" variant="ghost" onClick={() => navigate('/calendario')}>
                Ver en Calendario
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {saleData.condicion_pago === 'CREDITO' && (
        <Card className={`m-6 space-y-4 ${ds.text}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-base">Venta a Crédito · Vence: {saleData.fecha_vencimiento}</p>
              <p className={`text-sm ${ds.muted}`}>
                {creditSummary.adelantoPagadoHoy > 0
                  ? `El adelanto de S/ ${creditSummary.adelantoPagadoHoy.toFixed(2)} (${saleData.adelanto_metodo || 'Efectivo'}) ingresará hoy a Caja y se creará una Cuenta por Cobrar en estado PARCIAL por S/ ${creditSummary.saldoPendienteCredito.toFixed(2)}.`
                  : 'Se registrará una Cuenta por Cobrar en estado PENDIENTE por el saldo total. El cobro se registra posteriormente en Rendiciones.'}
              </p>
            </div>
            <Badge color={creditSummary.adelantoPagadoHoy > 0 ? 'amber' : 'blue'}>
              Estado CxC: {creditSummary.estadoCuenta}
            </Badge>
          </div>

          {/* Resumen de Facturación al Crédito (Feature 4) */}
          <div className={`p-4 rounded-xl border text-sm space-y-2 ${
            theme === 'dark' ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex justify-between">
              <span className={ds.muted}>Total Comprobante:</span>
              <span className="font-bold">S/. {creditSummary.totalComprobante.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-500 font-semibold">
                Adelanto Pagado Hoy (entra a Caja{creditSummary.adelantoPagadoHoy > 0 ? ` · ${saleData.adelanto_metodo || 'Efectivo'}` : ''}):
              </span>
              <span className="font-bold text-emerald-500">S/. {creditSummary.adelantoPagadoHoy.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 border-dashed border-slate-500/40">
              <span className="text-amber-500 font-bold">Saldo Pendiente a Crédito (va a Cuentas por Cobrar):</span>
              <span className="font-extrabold text-amber-500">S/. {creditSummary.saldoPendienteCredito.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Btn type="button" disabled={ticketGenerated} onClick={openTicket}>
              {ticketGenerated ? 'Cuenta por cobrar registrada' : 'Confirmar venta a crédito'}
            </Btn>
            {!ticketGenerated && (
              <Btn type="button" variant="secondary" onClick={handleSaveAsQuoteToCRM}>
                <FaPaperPlane className="text-xs" /> Guardar como Cotización en CRM
              </Btn>
            )}
            {ticketGenerated && <Btn type="button" variant="secondary" onClick={handleFinalizar}>Finalizar</Btn>}
            {!ticketGenerated && <Btn type="button" variant="ghost" onClick={onBack}>Volver a datos del cliente</Btn>}
          </div>
        </Card>
      )}

      {/* Body */}
      <div className={saleData.condicion_pago === 'CREDITO' ? 'hidden' : 'flex flex-1 overflow-hidden'}>
        {/* Left: Payment method cards */}
        <div className="flex-1 flex flex-col gap-3 px-8 py-6 max-w-lg">
          {PAYMENT_METHODS.map(pm => {
            const isActive = metodosPago.find(m => m.id === pm.key)?.activo !== false;
            return (
              <div key={pm.key} className="w-full">
                <button
                  type="button"
                  disabled={ticketGenerated}
                  onClick={() => { setSelectedMethod(pm.key); setWarnNoTicket(false); }}
                  className={`w-full flex flex-col px-6 py-5 border-2 rounded-xl transition-all text-left relative
                    ${selectedMethod === pm.key
                      ? (isActive ? 'border-yellow-500 bg-yellow-500/5' : 'border-red-500 bg-red-500/5')
                      : (isActive ? cardIdle : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-850/40 opacity-60')}
                  `}
                >
                  <div className="flex justify-between items-center w-full">
                    <p className={`font-bold italic text-base ${text}`}>{pm.label}</p>
                    {!isActive && (
                      <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Inhabilitado
                      </span>
                    )}
                  </div>
                  {pm.key === 'digital' && (
                    <div className="flex items-center flex-wrap gap-3 mt-3">
                      <span className="px-2 py-1 rounded-lg font-black text-sm" style={{background:'#7022f3',color:'#fff'}}>S/ yape</span>
                      <span className="px-2 py-1 rounded-full font-black text-sm" style={{background:'#00c896',color:'#fff'}}>plin</span>
                      <span className="px-2 py-1 rounded-sm font-black text-sm" style={{background:'#f04e37',color:'#fff'}}>izipay</span>
                    </div>
                  )}
                  {pm.key === 'bank'  && <span className="text-2xl mt-3">📱</span>}
                  {pm.key === 'cash'  && <span className="text-2xl mt-3">💰</span>}
                  {pm.key === 'pos'   && <span className="text-2xl mt-3">💳</span>}
                  {pm.sub && <p className={`text-xs mt-1 ${subTx}`}>{pm.sub}</p>}
                </button>

                {pm.key === 'cash' && selectedMethod === 'cash' && (
                  <div className={`mt-3 w-full p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'} space-y-3`}>
                    <label className={`block text-xs font-bold uppercase tracking-wider ${text}`}>Monto Recibido</label>
                    <input
                      type="number"
                      step="0.1"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      placeholder="Ingrese cantidad en efectivo"
                      className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                    {montoRecibido !== '' && (
                      <div className="flex justify-between items-center text-sm font-bold mt-1">
                        <span className={text}>Vuelto:</span>
                        {parseFloat(montoRecibido) < saleData.total ? (
                          <span className="text-red-500">Monto Insuficiente</span>
                        ) : (
                          <span className="text-green-600">S/. {(parseFloat(montoRecibido) - saleData.total).toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button type="button" disabled={ticketGenerated} onClick={onBack} className={`text-sm mt-1 ${subTx} hover:underline text-left`}>
            ← Volver a datos del cliente
          </button>
        </div>

        {/* Right: Dynamic state panel */}
        <div className={`flex-1 flex flex-col items-center justify-center border-l ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          {renderRightPanel()}
        </div>
      </div>

      {/* ── QR Modal ── */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className={`relative w-full max-w-md rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-5 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          }`}>
            <button type="button" onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-600">
              ✕
            </button>

            <div className="w-64 h-64 rounded-2xl border-4 border-gray-300 flex items-center justify-center overflow-hidden bg-white">
              {metodosPago.find(m => m.id === 'digital')?.qrPath
                ? <img src={metodosPago.find(m => m.id === 'digital').qrPath} alt="QR pago" className="w-full h-full object-contain" />
                : <div className="flex flex-col items-center gap-2 text-gray-400">
                    <span className="text-5xl">📷</span>
                    <p className="text-xs text-center px-4">Sin QR — adjunta uno desde Métodos de Pago</p>
                  </div>
              }
            </div>

            <p className={`text-base font-bold ${text}`}>
              Monto: &nbsp; <span className="text-xl">S/. {(saleData?.total || 0).toFixed(2)}</span>
            </p>

            <div className="flex items-center gap-6">
              <span className="px-3 py-2 rounded-xl font-black text-lg" style={{background:'#7022f3',color:'#fff'}}>S/ yape</span>
              <span className="px-3 py-2 rounded-full font-black text-lg" style={{background:'#00c896',color:'#fff'}}>plin</span>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button type="button" onClick={openTicket}
                className="flex-1 py-3 bg-[#1a1a1a] hover:bg-gray-700 text-white font-bold rounded-full text-sm tracking-wider">
                GENERAR TICKET
              </button>
              <button type="button" onClick={handleDupPantalla}
                className={`flex-1 py-3 border-2 font-bold rounded-full text-sm tracking-wide ${
                  theme === 'dark' ? 'border-gray-500 text-gray-200 hover:bg-gray-700' : 'border-gray-400 text-gray-800 hover:bg-gray-100'
                }`}>
                DUP. PANTALLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Phone / WhatsApp Modal ── */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          }`}>
            <h3 className="font-bold text-center text-base">Enviar comprobante virtual</h3>
            <p className={`text-sm text-center ${subTx}`}>Ingresa el número de celular del cliente (con código de país)</p>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="ej. 51987654321"
              autoFocus
              className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 placeholder-gray-400'
              }`}
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowPhoneModal(false)}
                className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm ${
                  theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                }`}>Cancelar</button>
              <button type="button" onClick={handleSendWhatsApp}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm">
                ENVIAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   ROOT Ventas Component (wizard controller)
───────────────────────────────────────────────────────────────── */
const Ventas = () => {
  const { theme } = useTheme();
  const ds = useDS();
  const navigate = useNavigate();
  const { isGlobalScope, effectiveSucursalId } = usePermission();
  const { posPreload, limpiarEnvioAPOS } = useCRM();
  const { productos, servicios } = useInventario();
  const {
    cajaSesiones,
    getActiveCajaByBranch,
    isCajaBlockedForCurrentUser,
    terminalInfo,
    refreshFinanzas,
  } = useFinanzas();

  const [preload] = useState(() => posPreload && (isGlobalScope || String(posPreload.sucursalId) === String(effectiveSucursalId)) ? posPreload : null);
  const [sucursalId, setSucursalId] = useState(() => String(preload?.sucursalId || effectiveSucursalId || getBranches()[0]?.id || '1'));
  const consumed = useRef(false);

  useEffect(() => {
    if (preload && !consumed.current) { consumed.current = true; limpiarEnvioAPOS(); }
  }, [preload, limpiarEnvioAPOS]);

  // Synchronize FinanzasContext with localStorage sessions opened/closed in Caja.jsx
  useEffect(() => {
    if (typeof refreshFinanzas === 'function') {
      refreshFinanzas();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursalId]);

  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [cart, setCart] = useState(() => (preload?.cart || []).reduce((rows, line) => {
    const type = line.item._type || (String(line.item.tipo).toUpperCase() === 'SERVICIO' ? 'Servicio' : 'Producto');
    const source = (type === 'Servicio' ? servicios : productos).find(p => String(p.id) === String(line.item.id) && p.nombre === line.item.nombre);
    const baseItem = { ...source, ...line.item, precio: line.item.precio, _type: type };
    const isDec = allowsDecimals(baseItem);
    const qty = normalizeQty(line.qty, isDec);
    const key = baseItem.varianteId ? `${type}-${baseItem.parentProductId || baseItem.id}-var-${baseItem.varianteId}` : `${type}-${baseItem.id}`;
    const found = rows.find(row => {
      const rKey = row.item.varianteId ? `${row.item._type}-${row.item.parentProductId || row.item.id}-var-${row.item.varianteId}` : `${row.item._type}-${row.item.id}`;
      return rKey === key;
    });
    if (found) found.qty = normalizeQty(found.qty + qty, isDec);
    else if (qty > 0) rows.push({ item: baseItem, qty });
    return rows;
  }, []));
  const [saleData, setSaleData] = useState(null);

  // Feature 1: Bloqueo Estricto de Ventas sin Caja Abierta o desde Otro Dispositivo
  const activeCaja = typeof getActiveCajaByBranch === 'function' ? getActiveCajaByBranch(sucursalId) : null;
  const blockedCheck = typeof isCajaBlockedForCurrentUser === 'function' ? isCajaBlockedForCurrentUser(sucursalId) : { blocked: false };
  const branchCanOperate = Boolean(activeCaja && !blockedCheck.blocked);
  const posAccess = resolvePosAccessState({
    canOperatePOS: branchCanOperate,
    isTerminalBlocked: blockedCheck.blocked,
    activeBranchCajaSesion: activeCaja,
    cajaSesiones,
    sucursalId,
    terminalInfo,
  });

  const branches = getBranches();
  const currentBranchName = branches.find(b => String(b.id) === String(sucursalId))?.nombre || `Sucursal #${sucursalId}`;

  if (posAccess.locked) {
    return (
      <div className={`flex flex-col flex-1 min-h-0 -m-6 ${ds.pageBg}`}>
        <PageHeader
          onBack={() => navigate('/principal')}
          right={isGlobalScope && (
            <select
              aria-label="Sucursal"
              value={sucursalId}
              onChange={e => setSucursalId(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs ${ds.input}`}
            >
              {branches.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          )}
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-lg w-full text-center p-8 space-y-5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
              <FaLock size={28} />
            </div>

            <div className="flex justify-center">
              <Badge dot color={posAccess.reasonType === 'OTHER_DEVICE' ? 'red' : 'amber'} size="md">
                {posAccess.reasonType === 'CLOSED' ? 'Caja cerrada' : 'Sesión no disponible'} · {currentBranchName}
              </Badge>
            </div>

            <div className="space-y-2">
              <h2 className={`text-xl font-extrabold tracking-tight ${ds.text}`}>
                {posAccess.reasonTitle}
              </h2>
              <p className={`text-sm leading-relaxed ${ds.muted}`}>
                {posAccess.reasonType === 'CLOSED' ? 'Abre tu caja para iniciar ventas. Podrás operar hasta cerrar el turno.' : 'La caja está reservada por otro usuario, dispositivo o pestaña. Usa la sesión que abrió el turno.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Btn
                type="button"
                variant="primary"
                size="lg"
                onClick={() => navigate('/caja')}
                className="w-full sm:w-auto"
              >
                <FaCashRegister /> Ir a Gestión de Caja
              </Btn>
              <Btn
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/principal')}
                className="w-full sm:w-auto"
              >
                Volver al Inicio
              </Btn>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const sharedProps = { theme, pageBg: ds.pageBg, sucursalId, onSucursalChange: setSucursalId, preloadedClient: preload?.preloadedClient, crmPreloadInfo: preload };

  if (step === 1) return <StepProductos {...sharedProps} cart={cart} setCart={setCart} onNext={() => setStep(2)} />;
  if (step === 2) return <StepCliente  {...sharedProps} cart={cart} onBack={() => setStep(1)} onNext={data => { setSaleData(data); setStep(3); }} />;
  if (step === 3) return <StepPago     {...sharedProps} cart={cart} saleData={saleData} onBack={() => setStep(2)} />;
  return null;
};

export default Ventas;
