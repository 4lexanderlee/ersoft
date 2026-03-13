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
} from 'react-icons/fa';
import { MdTune } from 'react-icons/md';
import PageHeader from '../components/ui/PageHeader';
import {
  validateDocNumber, validatePhone, validateEmail,
  validateName, sanitizeName, sanitizePhone, sanitizeDocNumber,
} from '../utils/clientValidations';


/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
const DOC_TYPES = ['DNI', 'CE', 'RUC'];
const DOC_MAX = { DNI: 8, CE: 9, RUC: 11 };
const SALE_TYPES = ['Ticket', 'Boleta', 'Factura', 'Cotizar'];
const DISCOUNT_CODES = { 'PROMO25': 0.25, 'DESC10': 0.10, 'VIP15': 0.15 };

/* ─────────────────────────────────────────────────────────────────
   STEP 1 – Product selection + cart
───────────────────────────────────────────────────────────────── */
const StepProductos = ({ cart, setCart, onNext, theme, pageBg, headerBg }) => {
  const navigate = useNavigate();
  const { productos, servicios, categorias, lotes } = useInventario();

  const [typeFilter, setTypeFilter] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loteFilter, setLoteFilter] = useState('');

  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [showLoteMenu, setShowLoteMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  // Fix 4: raw input values map (allows empty string while typing)
  const [rawInputs, setRawInputs] = useState({});

  const typeRef = useRef(null);
  const catRef = useRef(null);
  const loteRef = useRef(null);
  const cartRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) setShowTypeMenu(false);
      if (catRef.current && !catRef.current.contains(e.target)) setShowCatMenu(false);
      if (loteRef.current && !loteRef.current.contains(e.target)) setShowLoteMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Combine products + services
  const allItems = [
    ...productos.map(p => ({ ...p, _type: 'Producto' })),
    ...servicios.map(s => ({ ...s, _type: 'Servicio' })),
  ];

  const filtered = allItems.filter(item => {
    const matchType = typeFilter === 'Todos'
      || (typeFilter === 'Productos' && item._type === 'Producto')
      || (typeFilter === 'Servicios' && item._type === 'Servicio');
    const q = searchText.toLowerCase();
    const matchSearch = !searchText
      || item.nombre.toLowerCase().includes(q)
      // Also match by barcode (exact match or starts-with for scanning)
      || (item.codigoBarras && item.codigoBarras.includes(searchText));
    // Support multi-category array
    const itemCats = Array.isArray(item.categorias) ? item.categorias : (item.categoria ? [item.categoria] : []);
    const matchCat = !catFilter || itemCats.includes(catFilter);
    const matchLote = !loteFilter || (item._type === 'Producto' && Number(item.loteId) === Number(loteFilter));
    return matchType && matchSearch && matchCat && matchLote;
  });

  const allCats = [...new Set([...categorias.productos, ...categorias.servicios])];

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.qty * parseFloat(i.item.precio || 0), 0);

  const getQty = (id) => cart.find(c => c.item.id === id)?.qty || 0;
  const getMaxQty = (item) => item._type === 'Producto' ? (item.stock ?? 99) : 99;

  const setQty = (item, qty) => {
    qty = Math.max(0, Math.min(qty, getMaxQty(item)));
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (qty === 0) return prev.filter(c => c.item.id !== item.id);
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, qty } : c);
      return [...prev, { item, qty }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.item.id !== id));
  const clearCart = () => { setCart([]); setRawInputs({}); };

  // Fix 4: get display value for qty input (raw string if user is typing, else cart qty)
  const getDisplayQty = (id) => {
    if (id in rawInputs) return rawInputs[id];
    return String(getQty(id));
  };
  const handleQtyInputChange = (item, val) => {
    setRawInputs(prev => ({ ...prev, [item.id]: val }));
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed >= 0) setQty(item, parsed);
  };
  const handleQtyInputBlur = (item) => {
    const raw = rawInputs[item.id];
    if (raw !== undefined) {
      const val = Math.max(0, parseInt(raw) || 0);
      setQty(item, val);
      setRawInputs(prev => { const n = { ...prev }; delete n[item.id]; return n; });
    }
  };

  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputCls = theme === 'dark'
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const dropBg = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800';

  return (
    <div className={`flex flex-col flex-1 min-h-0 -m-6 ${pageBg}`}>
      <PageHeader onBack={() => navigate('/principal')} />

      {/* Main */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Products area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3 px-6 py-4 flex-wrap">
            {/* Tipo dropdown */}
            <div ref={typeRef} className="relative">
              <button
                onClick={() => setShowTypeMenu(!showTypeMenu)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium min-w-[100px] ${inputCls}`}
              >
                {typeFilter} {showTypeMenu ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>
              {showTypeMenu && (
                <div className={`absolute top-full left-0 mt-1 w-36 rounded-2xl border shadow-xl z-30 py-1 ${dropBg}`}>
                  {['Productos', 'Servicios', 'Todos'].map(t => (
                    <button key={t} onClick={() => { setTypeFilter(t); setShowTypeMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-yellow-500/10 transition-colors
                        ${typeFilter === t ? 'font-bold text-yellow-500' : ''}`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div className={`flex items-center flex-1 gap-2 px-4 py-2 border rounded-full ${inputCls}`}>
              <FaSearch className="text-gray-400" size={14} />
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Buscar por nombre de producto o servicio..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>

            {/* Category filter */}
            <div ref={catRef} className="relative">
              <button onClick={() => setShowCatMenu(!showCatMenu)}
                className={`p-2.5 rounded-full border ${inputCls} hover:border-yellow-500 transition-colors`}>
                <MdTune size={18} />
              </button>
              {showCatMenu && allCats.length > 0 && (
                <div className={`absolute top-full right-0 mt-1 w-44 rounded-2xl border shadow-xl z-30 py-2 ${dropBg}`}>
                  <button onClick={() => { setCatFilter(''); setShowCatMenu(false); }}
                    className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${!catFilter ? 'font-bold text-yellow-500' : ''}`}>
                    Todas
                  </button>
                  {allCats.map(c => (
                    <button key={c} onClick={() => { setCatFilter(c); setShowCatMenu(false); }}
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${catFilter === c ? 'font-bold text-yellow-500' : ''}`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lote filter */}
            {typeFilter !== 'Servicios' && lotes && lotes.length > 0 && (
              <div ref={loteRef} className="relative z-20">
                <button onClick={() => setShowLoteMenu(!showLoteMenu)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium ${inputCls} hover:border-yellow-500 transition-colors`}>
                  {loteFilter ? (lotes.find(l => l.id === Number(loteFilter))?.nombre || 'Lote') : 'Todos los Lotes'} {showLoteMenu ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </button>
                {showLoteMenu && (
                  <div className={`absolute top-full left-0 mt-1 w-44 rounded-2xl border shadow-xl z-30 py-2 ${dropBg}`}>
                    <button onClick={() => { setLoteFilter(''); setShowLoteMenu(false); }}
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${!loteFilter ? 'font-bold text-yellow-500' : ''}`}>
                      Todos los Lotes
                    </button>
                    {lotes.map(l => (
                      <button key={l.id} onClick={() => { setLoteFilter(l.id); setShowLoteMenu(false); }}
                        className={`w-full text-left px-4 py-1.5 text-sm hover:bg-yellow-500/10 ${loteFilter === l.id ? 'font-bold text-yellow-500' : ''}`}>
                        {l.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cart icon */}
            <div className="relative">
              <button onClick={() => setShowCart(!showCart)}
                className={`p-2.5 rounded-full border ${inputCls} hover:border-yellow-500 transition-colors`}>
                <FaShoppingCart size={18} />
              </button>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-20">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No se encontraron productos o servicios.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(item => {
                  const qty = getQty(item.id);
                  const maxQty = getMaxQty(item);
                  const isInCart = qty > 0;

                  return (
                    <div key={item.id} className={`rounded-2xl border p-4 flex flex-col gap-2 ${cardBg}
                      ${isInCart ? (theme === 'dark' ? 'border-yellow-500/60' : 'border-yellow-400') : ''}`}>
                      <p className={`text-xs font-bold uppercase tracking-wide ${isInCart ? 'text-yellow-500' : (theme === 'dark' ? 'text-gray-100' : 'text-gray-800')}`}>
                        {item.nombre}
                      </p>
                      {/* Image */}
                      <div 
                        onClick={() => setQty(item, getQty(item.id) + 1)}
                        className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
                        title="Haz clic para agregar rápido 1 unidad"
                      >
                        {item.imagen
                          ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain pointer-events-none" />
                          : <FaImage size={32} className={`pointer-events-none ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />}
                      </div>
                      {/* Price */}
                      <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Precio: S/. {parseFloat(item.precio || 0).toFixed(2)}
                      </p>
                      {item._type === 'Producto' && (
                        <p className={`text-xs text-center ${item.stock <= 0 ? 'text-red-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                          Stock: {item.stock ?? 0}
                        </p>
                      )}
                      {/* Qty selector */}
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <button
                          onClick={() => setQty(item, getQty(item.id) - 1)}
                          disabled={getQty(item.id) === 0}
                          className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors
                            disabled:opacity-30 ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-400 text-gray-600 hover:bg-gray-100'}`}>
                          <FaMinus size={10} />
                        </button>
                        <input
                          type="number"
                          value={getDisplayQty(item.id)}
                          onChange={e => handleQtyInputChange(item, e.target.value)}
                          onBlur={() => handleQtyInputBlur(item)}
                          min={0}
                          max={maxQty}
                          className={`w-16 text-center text-sm py-1 border rounded-full outline-none ${inputCls}`}
                        />
                        <button
                          onClick={() => setQty(item, getQty(item.id) + 1)}
                          disabled={item._type === 'Producto' && getQty(item.id) >= maxQty}
                          className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors
                            disabled:opacity-30 ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-400 text-gray-600 hover:bg-gray-100'}`}>
                          <FaPlus size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-red-400"><FaTimes /></button>
              </div>
              {/* Cart items */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {cart.length === 0 ? (
                  <p className={`text-sm text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>El carrito está vacío</p>
                ) : (
                  cart.map(({ item, qty }) => (
                    <div key={item.id}
                      className={`flex items-center justify-between px-3 py-3 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold uppercase truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{item.nombre}</p>
                        <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Cant. {qty} &nbsp; Total. S/. {(qty * parseFloat(item.precio || 0)).toFixed(2)}
                        </p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="ml-3 text-red-400 hover:text-red-500 transition-colors shrink-0">
                        <FaTrash size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {/* Cart footer */}
              <div className={`border-t px-4 py-4 space-y-3 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>SUBTOTAL</span>
                  <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>S/. {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearCart}
                    className={`flex-1 py-2.5 rounded-full border font-bold text-sm transition-colors
                      ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-400 text-gray-700 hover:bg-gray-100'}`}>
                    VACIAR CARRITO
                  </button>
                  <button
                    onClick={() => { setShowCart(false); onNext(); }}
                    disabled={cart.length === 0}
                    className="flex-1 py-2.5 rounded-full bg-gray-800 hover:bg-yellow-500 hover:text-black text-white font-bold text-sm disabled:opacity-40 transition-colors duration-300 cursor-pointer">
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
          onClick={onNext}
          disabled={cart.length === 0}
          className="fixed bottom-8 right-8 flex items-center gap-3 px-7 py-3 bg-gray-700 hover:bg-yellow-500 hover:text-black disabled:opacity-40 text-white font-bold rounded-full shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 z-40"
        >
          SIGUIENTE <FaArrowLeft className="rotate-180" />
        </button>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   STEP 2 – Client data + order description
───────────────────────────────────────────────────────────────── */
const StepCliente = ({ cart, onBack, onNext, theme, pageBg, headerBg }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [client, setClient] = useState(null);
  const [clientForm, setClientForm] = useState({ nombre: '', apellidos: '', documento: '', telefono: '', correo: '' });
  const [clientErrors, setClientErrors] = useState({});
  const [notFound, setNotFound] = useState(false);
  const [saleType, setSaleType] = useState('Ticket');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedCodes, setAppliedCodes] = useState([]);
  const [discountMsg, setDiscountMsg] = useState('');
  const [addClientMsg, setAddClientMsg] = useState('');

  const { empresa } = useEmpresa();

  // Pre-load client passed from Principal (Venta button)
  useEffect(() => {
    const preloaded = location.state?.preloadedClient;
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

  const subtotal = cart.reduce((s, { item, qty }) => s + qty * parseFloat(item.precio || 0), 0);

  const calcDiscount = () => {
     if (appliedCodes.length === 0) return { rate: 0, amt: 0 };
     let amt = 0;
     let globalRateSum = 0;
     const today = new Date();
     today.setHours(0,0,0,0);

     cart.forEach(({item, qty}) => {
       if (item.codigoDsct) {
         const itemCode = item.codigoDsct.trim().toUpperCase();
         if (appliedCodes.includes(itemCode)) {
           const from = item.vigenciaDesde ? new Date(item.vigenciaDesde + 'T00:00:00') : null;
           const to = item.vigenciaHasta ? new Date(item.vigenciaHasta + 'T23:59:59') : null;
           if ((!from || today >= from) && (!to || today <= to)) {
              let val = parseInt(item.valorDsct, 10) || 0;
              if (item.tipoDsct === '%') {
                   amt += ((parseFloat(item.precio) || 0) * (val / 100)) * qty;
              } else {
                   amt += val * qty;
              }
           }
         }
       }
     });

     appliedCodes.forEach(code => {
       if (DISCOUNT_CODES[code]) {
          globalRateSum += DISCOUNT_CODES[code];
       }
     });

     if (globalRateSum > 1) globalRateSum = 1;
     let totalAmt = amt + (subtotal * globalRateSum);
     if (totalAmt > subtotal) totalAmt = subtotal;

     return { rate: globalRateSum, amt: totalAmt };
  };

  const { rate: discount, amt: discountAmt } = calcDiscount();
  const total = Math.max(0, subtotal - discountAmt);

  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputCls = theme === 'dark' ? 'bg-transparent border-gray-600 text-white placeholder-gray-500' : 'bg-transparent border-gray-300 text-gray-900 placeholder-gray-400';
  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const sectionBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  const handleSearch = () => {
    const allClients = [
      ...simulatedClients,
      ...JSON.parse(localStorage.getItem('ersoft_clients') || '[]'),
    ];
    const found = allClients.find(c => c.docType === docType && c.docNumber === docNumber);
    if (found) {
      setClient(found);
      setNotFound(false);
      setClientForm({
        nombre: found.name || '',
        apellidos: found.surname || '',
        documento: found.docNumber || '',
        telefono: found.telefono || '',
        correo: found.correo || '',
      });
    } else {
      setClient(null);
      setNotFound(true);
      setClientForm({ nombre: '', apellidos: '', documento: docNumber, telefono: '', correo: '' });
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handleAddClient = () => {
    const effectiveDocNumber = docNumber.trim() || clientForm.documento.trim();
    const errs = {};

    const eNombre    = validateName(clientForm.nombre, 'Nombres');
    const eApellidos = validateName(clientForm.apellidos, 'Apellidos');
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
    // Avoid duplicate: only insert if no client with same docType+docNumber exists
    const isDuplicate = effectiveDocNumber && saved.some(
      c => c.docType === docType && c.docNumber === effectiveDocNumber
    );
    if (!isDuplicate) {
      localStorage.setItem('ersoft_clients', JSON.stringify([...saved, newClient]));
    }
    setClient(newClient);
    setNotFound(false);
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

    const today = new Date();
    today.setHours(0,0,0,0);
    
    let itemMatch = cart.some(({item}) => {
       if (item.codigoDsct && item.codigoDsct.trim().toUpperCase() === code) {
         const from = item.vigenciaDesde ? new Date(item.vigenciaDesde + 'T00:00:00') : null;
         const to = item.vigenciaHasta ? new Date(item.vigenciaHasta + 'T23:59:59') : null;
         return (!from || today >= from) && (!to || today <= to);
       }
       return false;
    });

    if (itemMatch || DISCOUNT_CODES[code]) {
       setAppliedCodes([...appliedCodes, code]);
       setDiscountMsg('✓ Descuento aplicado');
       setDiscountCode('');
    } else {
       setDiscountMsg('✗ Código inválido o no aplica a estos productos');
    }
  };

  const handleRemoveDiscount = (codeToRemove) => {
     setAppliedCodes(appliedCodes.filter(c => c !== codeToRemove));
  };

  const docPlaceholder = { DNI: '8 dígitos', CE: '9 dígitos', RUC: '11 dígitos' };

  // Always allow saving client if not already selected and name filled
  const canAddClient = !client && (clientForm.nombre.trim() || clientForm.apellidos.trim());

  // Lógica de visibilidad condicional de documentos
  const isRusRucEmpresa = empresa?.tipoDocumento === 'RUS' || empresa?.tipoDocumento === 'RUC';
  const isRucEmpresa = empresa?.tipoDocumento === 'RUC';
  
  const availableSaleTypes = SALE_TYPES.filter(type => {
    if (type === 'Cotizar') return true;
    if (type === 'Ticket') return ['DNI', 'RUS', 'RUC'].includes(docType); // Siempre visible si es uno de estos
    if (type === 'Boleta') return isRusRucEmpresa;
    if (type === 'Factura') return isRucEmpresa;
    return true;
  });

  // Si el tipo de venta actual ya no está disponible tras cambiar de cliente o de documento, volver a Ticket o Cotizar
  useEffect(() => {
    if (!availableSaleTypes.includes(saleType)) {
      setSaleType(availableSaleTypes[0] || 'Ticket');
    }
  }, [docType, availableSaleTypes, saleType]);

  const handleCotizar = () => {
    const saleData = { client: clientForm, saleType, discount, discountAmt, subtotal, total };
    const html = buildProformaHTML(empresa, cart, saleData, user?.name || user?.username || 'Vendedor');
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
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
            <select value={docType} onChange={e => { setDocType(e.target.value); setDocNumber(''); setClient(null); setNotFound(false); setClientErrors({}); }}
              className={`px-3 py-2 border rounded-full text-sm outline-none ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              value={docNumber}
              onChange={e => setDocNumber(sanitizeDocNumber(docType, e.target.value))}
              onKeyDown={handleKeyDown}
              placeholder={`Digite aquí la documentación del cliente (${docPlaceholder[docType]})`}
              className={`flex-1 px-4 py-2 border rounded-full text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
            />
            <button onClick={handleSearch}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full text-sm font-semibold">
              <FaSearch size={13} />
            </button>
          </div>

          {/* Sale type tabs */}
          <div className={`flex rounded-none overflow-hidden border-b-0 ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#1a1a1a]'}`}>
            {availableSaleTypes.map(t => (
              <button key={t} onClick={() => setSaleType(t)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors
                  ${saleType === t ? 'text-white underline underline-offset-4' : 'text-gray-400 hover:text-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Client form fields */}
          <div className={`rounded-2xl border p-5 space-y-3 ${sectionBg}`}>
            {/* Nombres */}
            <div className="flex items-start gap-2 border-b pb-2">
              <label className={`text-sm w-24 pt-1 ${text}`}>Nombres <span className="text-red-500">*</span></label>
              <div className="flex-1">
                <input
                  value={clientForm.nombre}
                  onChange={e => {
                    setClientForm(p => ({ ...p, nombre: sanitizeName(e.target.value) }));
                    if (clientErrors.nombre) setClientErrors(p => { const n={...p}; delete n.nombre; return n; });
                  }}
                  placeholder="ej. Rodrigo Alberto"
                  disabled={!!client}
                  className={`w-full text-sm border-b bg-transparent outline-none py-1 ${inputCls} disabled:opacity-60
                    ${clientErrors.nombre ? 'border-red-500' : ''}`}
                />
                {clientErrors.nombre && <p className="text-red-400 text-[11px] mt-0.5">{clientErrors.nombre}</p>}
              </div>
            </div>
            {/* Apellidos */}
            <div className="flex items-start gap-2 border-b pb-2">
              <label className={`text-sm w-24 pt-1 ${text}`}>Apellidos <span className="text-red-500">*</span></label>
              <div className="flex-1">
                <input
                  value={clientForm.apellidos}
                  onChange={e => {
                    setClientForm(p => ({ ...p, apellidos: sanitizeName(e.target.value) }));
                    if (clientErrors.apellidos) setClientErrors(p => { const n={...p}; delete n.apellidos; return n; });
                  }}
                  placeholder="ej. Garcia Peréz"
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
                  onClick={() => { setClient(null); setDocNumber(''); setClientForm({ nombre: '', apellidos: '', documento: '', telefono: '', correo: '' }); setClientErrors({}); setNotFound(false); setAddClientMsg(''); }}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Cambiar cliente
                </button>
              </div>
            )}
          </div>

          {/* Back */}
          <button onClick={onBack} className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} underline`}>
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
                <button onClick={handleApplyDiscount}
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
                      <button onClick={() => handleRemoveDiscount(code)} className="ml-1 hover:text-red-500"><FaTimes size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Order summary */}
        <div className={`w-72 flex flex-col border-l ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`px-5 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`font-bold italic text-base ${text}`}>Descripción</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {cart.map(({ item, qty }) => (
              <div key={item.id} className={`px-3 py-2 rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs font-bold uppercase truncate ${text}`}>{item.nombre}</p>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Cant. {qty} &nbsp; Total. S/. {(qty * parseFloat(item.precio || 0)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className={`border-t px-5 py-4 space-y-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between text-sm">
              <span className={`font-semibold uppercase ${text}`}>Subtotal</span>
              <span className={text}>S/. {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Descuento</span>
                <span className="text-green-400">−S/. {discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base">
              <span className={text}>TOTAL</span>
              <span className={text}>S/. {total.toFixed(2)}</span>
            </div>
            {saleType === 'Cotizar' ? (
              <button onClick={handleCotizar}
                className="w-full py-3 bg-gray-700 hover:bg-yellow-500 hover:text-black text-white font-bold rounded-full text-sm flex items-center justify-center gap-2 mt-2 transition-colors duration-300 cursor-pointer">
                COTIZAR
              </button>
            ) : (
              <button onClick={() => onNext({ client: clientForm, saleType, discount, discountAmt, total, subtotal })}
                className="w-full py-3 bg-gray-700 hover:bg-yellow-500 hover:text-black text-white font-bold rounded-full text-sm flex items-center justify-center gap-2 mt-2 transition-colors duration-300 cursor-pointer">
                IR A PAGAR <FaArrowLeft className="rotate-180" />
              </button>
            )}
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
const TIPO_PREFIX = { Ticket: 'TKT', Boleta: 'BOL', Factura: 'FAC', Cotizar: 'COT' };
const genSaleId = (tipo) => `${TIPO_PREFIX[tipo] || 'TKT'}-${Date.now().toString().slice(-8)}`;

const buildTicketHTML = (empresa, cart, saleData, payMethod, saleId, vendedor) => {
  const date = new Date().toLocaleString('es-PE');
  const rows = cart.map(({ item, qty }) => `
    <tr>
      <td>${item.nombre}</td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">S/. ${parseFloat(item.precio || 0).toFixed(2)}</td>
      <td style="text-align:right">S/. ${(qty * parseFloat(item.precio || 0)).toFixed(2)}</td>
    </tr>`).join('');
  const payLabel = { digital: 'Billetera electrónica', bank: 'Transferencia / CCI', cash: 'Efectivo', pos: 'POS' }[payMethod] || payMethod;
  const clientName = saleData?.client ? `${saleData.client.nombre} ${saleData.client.apellidos}` : 'Consumidor final';
  
  const dscAmt = saleData?.discountAmt || (saleData?.discount ? saleData.subtotal * saleData.discount : 0);
  const discountLabel = (saleData?.discount > 0 && saleData?.discount < 1) ? `Descuento (${(saleData.discount * 100).toFixed(0)}%)` : 'Descuento';
  const discount = dscAmt > 0 ? `<tr><td colspan="3" style="text-align:right">${discountLabel}</td><td style="text-align:right;color:green">-S/. ${dscAmt.toFixed(2)}</td></tr>` : '';

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
        ${discount}
        <tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">S/. ${(saleData?.total || 0).toFixed(2)}</td></tr>
      </tfoot>
    </table>
    <div class="footer">
      <div class="divider"></div>
      <p>¡Gracias por su compra!</p>
      <p>®ERSOFT - Todos los derechos reservados</p>
    </div>
    <script>window.onload = () => { window.print(); }<\/script>
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
  
  const proformaId = `PROF-${Date.now().toString().slice(-6)}`;
  const subTotalStr = (saleData.subtotal || 0).toFixed(2);
  const totalStr = (saleData.total || 0).toFixed(2);

  const qrTag = empresa?.qrPath
    ? `<img src="${empresa.qrPath}" alt="QR" class="w-32 h-32 object-contain ml-4 rounded-lg shadow-sm border border-gray-100" />`
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
              <td class="py-1.5 px-2 text-center text-gray-900">${qty}</td>
              <td class="py-1.5 px-2 text-right text-gray-900 whitespace-nowrap">S/. ${parseFloat(item.precio || 0).toFixed(2)}</td>
              <td class="py-1.5 px-2 text-right text-gray-900 whitespace-nowrap font-medium">S/. ${(qty * parseFloat(item.precio || 0)).toFixed(2)}</td>
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
            <td class="text-right font-semibold text-gray-900 whitespace-nowrap">S/. ${subTotalStr}</td>
          </tr>
          ${(saleData?.discountAmt > 0 || saleData?.discount > 0) ? `<tr><td class="py-1">${(saleData?.discount > 0 && saleData?.discount < 1) ? `Descuento (${(saleData.discount * 100).toFixed(0)}%)` : 'Descuento'}:</td><td class="text-right text-red-600 font-semibold whitespace-nowrap">-S/. ${(saleData?.discountAmt || (saleData.subtotal * saleData.discount)).toFixed(2)}</td></tr>` : ''}
          <tr>
            <td class="py-1">IGV (18% ref.):</td>
            <td class="text-right font-semibold text-gray-900">Incluido</td>
          </tr>
        </table>
        <div class="border-t-2 border-black mt-2 pt-2 flex justify-between items-center">
          <span class="font-black text-xs text-gray-900 uppercase tracking-widest">TOTAL</span>
          <span class="font-black text-[14px] text-green-700 whitespace-nowrap">S/. ${totalStr}</span>
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

const StepPago = ({ saleData, cart, onBack, theme, pageBg, headerBg }) => {
  const navigate = useNavigate();
  const { updateProducto, productos, bulkUpdateStock } = useInventario();
  const { empresa } = useEmpresa();
  const { user } = useAuth();

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showQrModal, setShowQrModal]   = useState(false);
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [showPhoneModal, setShowPhoneModal]   = useState(false);
  const [phone, setPhone] = useState('');
  const [warnNoTicket, setWarnNoTicket] = useState(false);
  // Guard: ensures comprobante is saved only once per sale
  const saleIdRef = useRef(null);
  const getSaleId = () => {
    if (!saleIdRef.current) saleIdRef.current = genSaleId(saleData?.saleType || 'Ticket');
    return saleIdRef.current;
  };
  const saveComprobante = () => {
    if (saleIdRef.current) return; // already saved
    const saleId = getSaleId();
    const record = {
      id: saleId,
      tipo: saleData?.saleType || 'Ticket',
      fecha: new Date().toISOString(),
      estado: 'Activo',
      cliente: saleData?.client || null,
      vendedor: user?.name || user?.username || 'Vendedor',
      items: cart.map(({ item, qty }) => ({
        id: item.id, nombre: item.nombre, precio: parseFloat(item.precio || 0), qty,
        _type: item._type,
      })),
      total: saleData.total,
      subtotal: saleData.subtotal,
      discount: saleData?.discount || 0,
      discountAmt: saleData?.discountAmt || 0,
      metodoPago: selectedMethod,
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
    const prev = JSON.parse(localStorage.getItem('ersoft_comprobantes') || '[]');
    localStorage.setItem('ersoft_comprobantes', JSON.stringify([record, ...prev]));
  };

  const text  = theme === 'dark' ? 'text-white'     : 'text-gray-900';
  const subTx = theme === 'dark' ? 'text-gray-400'  : 'text-gray-500';
  const cardIdle = theme === 'dark'
    ? 'border-gray-600 bg-gray-800 hover:border-gray-400'
    : 'border-gray-300 bg-white hover:border-gray-500';

  /* ── helpers ── */
  const deductStock = () => {
    const changes = cart
      .filter(({ item }) => item._type === 'Producto')
      .map(({ item, qty }) => ({ id: item.id, delta: -qty }));
    if (changes.length > 0) bulkUpdateStock(changes);
  };

  const openTicket = () => {
    saveComprobante(); // persist before anything else
    const saleId = getSaleId();
    const html = buildTicketHTML(empresa, cart, saleData, selectedMethod, saleId, user?.name || user?.username || 'Vendedor');
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    // Deduct stock exactly once when ticket is generated
    deductStock();
    setTicketGenerated(true);
    setWarnNoTicket(false);
    setShowQrModal(false);
  };

  const handleFinalizar = () => {
    if (!ticketGenerated) { setWarnNoTicket(true); return; }
    // Stock was already deducted when ticket was generated.
    // Use hard reload so wizard state fully resets for the next sale.
    window.location.replace('/ventas');
  };

  const handleSendWhatsApp = () => {
    if (!phone.trim()) return;
    saveComprobante(); // persist before sending
    const clientName = saleData?.client ? `${saleData.client.nombre} ${saleData.client.apellidos}` : 'cliente';
    const items = cart.map(({ item, qty }) => `• ${item.nombre} x${qty} = S/. ${(qty * parseFloat(item.precio || 0)).toFixed(2)}`).join('%0A');
    const msg = `*Comprobante de compra - ${empresa?.razonSocial || 'ERSOFT'}*%0AFecha: ${new Date().toLocaleString('es-PE')}%0ACliente: ${clientName}%0A%0A${items}%0A%0A*TOTAL: S/. ${(saleData?.total || 0).toFixed(2)}*%0A%0AGracias por su compra.`;
    window.open(`https://wa.me/${phone.replace(/\D/g,'')}?text=${msg}`, '_blank');
    // Deduct stock exactly once when message/ticket is sent
    deductStock();
    setShowPhoneModal(false);
    setTicketGenerated(true);
    setWarnNoTicket(false);
  };

  /* ── right panel content ── */
  const RightPanel = () => {
    if (ticketGenerated) return (
      <div className="text-center px-8 space-y-6">
        <p className={`text-sm italic ${subTx}`}>Pago confirmado, puedes revisar el ticket en TBF</p>
        <div className="text-5xl">😊</div>
        <button onClick={handleFinalizar}
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
      <div className="text-center px-8 space-y-4">
        <p className={`text-sm italic ${subTx}`}>Seleccione un medio de pago y confirme la operación</p>
        <div className="text-4xl opacity-40">🙂</div>
      </div>
    );
    // Method selected, ticket not yet generated
    return (
      <div className="text-center px-8 space-y-6">
        <p className={`text-sm italic text-center ${subTx}`}>
          Verifica que el pago se haya completado y se haya generado el comprobante o ticket
        </p>
        <div className="text-3xl">👀</div>
        {selectedMethod === 'digital' ? (
          <button onClick={() => setShowQrModal(true)}
            className="w-full py-3 bg-[#1a1a1a] hover:bg-gray-800 text-white font-bold rounded-full tracking-widest text-sm">
            GENERAR CODIGO QR
          </button>
        ) : (
          <button onClick={openTicket}
            className="w-full py-3 bg-[#1a1a1a] hover:bg-gray-800 text-white font-bold rounded-full tracking-widest text-sm">
            GENERAR TICKET
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col flex-1 -m-6 ${pageBg}`}>
      <PageHeader onBack={() => navigate('/principal')} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Payment method cards */}
        <div className="flex-1 flex flex-col gap-3 px-8 py-6 max-w-lg">
          {PAYMENT_METHODS.map(pm => (
            <button key={pm.key}
              onClick={() => { setSelectedMethod(pm.key); setTicketGenerated(false); setWarnNoTicket(false); }}
              className={`flex flex-col px-6 py-5 border-2 rounded-xl transition-all text-left
                ${selectedMethod === pm.key
                  ? 'border-yellow-500 bg-yellow-500/5'
                  : cardIdle}`}>
              <p className={`font-bold italic text-base ${text}`}>{pm.label}</p>
              {pm.key === 'digital' && (
                <div className="flex items-center flex-wrap gap-3 mt-3">
                  {/* Yape */}
                  <span className="px-2 py-1 rounded-lg font-black text-sm" style={{background:'#7022f3',color:'#fff'}}>S/ yape</span>
                  {/* Plin */}
                  <span className="px-2 py-1 rounded-full font-black text-sm" style={{background:'#00c896',color:'#fff'}}>plin</span>
                  {/* izipay */}
                  <span className="px-2 py-1 rounded-sm font-black text-sm" style={{background:'#f04e37',color:'#fff'}}>izipay</span>
                </div>
              )}
              {pm.key === 'bank'  && <span className="text-2xl mt-3">📱</span>}
              {pm.key === 'cash'  && <span className="text-2xl mt-3">💰</span>}
              {pm.key === 'pos'   && <span className="text-2xl mt-3">💳</span>}
              {pm.sub && <p className={`text-xs mt-1 ${subTx}`}>{pm.sub}</p>}
            </button>
          ))}
          <button onClick={onBack} className={`text-sm mt-1 ${subTx} hover:underline text-left`}>
            ← Volver a datos del cliente
          </button>
        </div>

        {/* Right: Dynamic state panel */}
        <div className={`flex-1 flex flex-col items-center justify-center border-l ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <RightPanel />
        </div>
      </div>



      {/* ── QR Modal ── */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className={`relative w-full max-w-md rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-5 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          }`}>
            {/* Close */}
            <button onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-600">
              ✕
            </button>

            {/* QR Image */}
            <div className="w-64 h-64 rounded-2xl border-4 border-gray-300 flex items-center justify-center overflow-hidden bg-white">
              {empresa?.qrPath
                ? <img src={empresa.qrPath} alt="QR pago" className="w-full h-full object-contain" />
                : <div className="flex flex-col items-center gap-2 text-gray-400">
                    <span className="text-5xl">📷</span>
                    <p className="text-xs text-center px-4">Sin QR — adjunta uno desde Ajustes &gt; Empresa</p>
                  </div>
              }
            </div>

            {/* Amount */}
            <p className={`text-base font-bold ${text}`}>
              Monto: &nbsp; <span className="text-xl">S/. {(saleData?.total || 0).toFixed(2)}</span>
            </p>

            {/* Payment logos */}
            <div className="flex items-center gap-6">
              <span className="px-3 py-2 rounded-xl font-black text-lg" style={{background:'#7022f3',color:'#fff'}}>S/ yape</span>
              <span className="px-3 py-2 rounded-full font-black text-lg" style={{background:'#00c896',color:'#fff'}}>plin</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 w-full mt-2">
              <button onClick={openTicket}
                className="flex-1 py-3 bg-[#1a1a1a] hover:bg-gray-700 text-white font-bold rounded-full text-sm tracking-wider">
                GENERAR TICKET
              </button>
              <button onClick={() => { setShowQrModal(false); setShowPhoneModal(true); }}
                className={`flex-1 py-3 border-2 font-bold rounded-full text-sm tracking-wide ${
                  theme === 'dark' ? 'border-gray-500 text-gray-200 hover:bg-gray-700' : 'border-gray-400 text-gray-800 hover:bg-gray-100'
                }`}>
                ENVIAR COMPROBANTE VIRTUAL
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
              <button onClick={() => setShowPhoneModal(false)}
                className={`flex-1 py-2.5 border rounded-xl font-semibold text-sm ${
                  theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                }`}>Cancelar</button>
              <button onClick={handleSendWhatsApp}
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
  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [cart, setCart] = useState([]);
  const [saleData, setSaleData] = useState(null);

  const pageBg   = theme === 'dark' ? 'bg-[#313b48]' : 'bg-[#d6d0d4]';
  const headerBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-[#e8e3e8] border-gray-200';
  const sharedProps = { theme, pageBg, headerBg };

  if (step === 1) return <StepProductos {...sharedProps} cart={cart} setCart={setCart} onNext={() => setStep(2)} />;
  if (step === 2) return <StepCliente  {...sharedProps} cart={cart} onBack={() => setStep(1)} onNext={data => { setSaleData(data); setStep(3); }} />;
  if (step === 3) return <StepPago     {...sharedProps} cart={cart} saleData={saleData} onBack={() => setStep(2)} />;
  return null;
};

export default Ventas;
