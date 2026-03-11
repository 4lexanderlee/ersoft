import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useInventario } from '../context/InventarioContext';
import { useEmpresa } from '../context/EmpresaContext';
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
  const { productos, servicios, categorias } = useInventario();

  const [typeFilter, setTypeFilter] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  // Fix 4: raw input values map (allows empty string while typing)
  const [rawInputs, setRawInputs] = useState({});

  const typeRef = useRef(null);
  const catRef = useRef(null);
  const cartRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) setShowTypeMenu(false);
      if (catRef.current && !catRef.current.contains(e.target)) setShowCatMenu(false);
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
    return matchType && matchSearch && matchCat;
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
    <div className={`flex flex-col h-full -m-6 ${pageBg}`}>
      <PageHeader onBack={() => navigate('/principal')} />

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Products area */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
                      <div className={`w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {item.imagen
                          ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain" />
                          : <FaImage size={32} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'} />}
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
                    className="flex-1 py-2.5 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm disabled:opacity-40 transition-colors">
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
          className="fixed bottom-8 right-8 flex items-center gap-3 px-7 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white font-bold rounded-full shadow-2xl transition-all hover:scale-105 z-40"
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
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [client, setClient] = useState(null);
  const [clientForm, setClientForm] = useState({ nombre: '', apellidos: '', documento: '', telefono: '', correo: '' });
  const [clientErrors, setClientErrors] = useState({});
  const [notFound, setNotFound] = useState(false);
  const [saleType, setSaleType] = useState('Ticket');
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountMsg, setDiscountMsg] = useState('');
  const [addClientMsg, setAddClientMsg] = useState('');

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
  const discountAmt = subtotal * discount;
  const total = subtotal - discountAmt;

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
    const rate = DISCOUNT_CODES[discountCode.trim().toUpperCase()];
    if (rate) {
      setDiscount(rate);
      setDiscountMsg(`✓ Descuento del ${(rate * 100).toFixed(0)}% aplicado`);
    } else {
      setDiscount(0);
      setDiscountMsg('✗ Código inválido');
    }
  };

  const docPlaceholder = { DNI: '8 dígitos', CE: '9 dígitos', RUC: '11 dígitos' };

  // Always allow saving client if not already selected and name filled
  const canAddClient = !client && (clientForm.nombre.trim() || clientForm.apellidos.trim());

  return (
    <div className={`flex flex-col h-full -m-6 ${pageBg}`}>
      <PageHeader onBack={() => navigate('/principal')} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Client form */}
        <div className="flex-1 overflow-y-auto px-8 py-5 space-y-4">
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
            {SALE_TYPES.map(t => (
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
              <p className={`text-xs mt-2 ${discountMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{discountMsg}</p>
            )}
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
            <button onClick={() => onNext({ client: clientForm, saleType, discount, total })}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full text-sm flex items-center justify-center gap-2 mt-2">
              IR A PAGAR <FaArrowLeft className="rotate-180" />
            </button>
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

const buildTicketHTML = (empresa, cart, saleData, payMethod, saleId) => {
  const date = new Date().toLocaleString('es-PE');
  const rows = cart.map(({ item, qty }) => `
    <tr>
      <td>${item.nombre}</td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">S/. ${parseFloat(item.precio || 0).toFixed(2)}</td>
      <td style="text-align:right">S/. ${(qty * parseFloat(item.precio || 0)).toFixed(2)}</td>
    </tr>`).join('');
  const payLabel = { digital: 'Billetera electrónica', bank: 'Transferencia / CCI', cash: 'Efectivo' }[payMethod] || payMethod;
  const clientName = saleData?.client ? `${saleData.client.nombre} ${saleData.client.apellidos}` : 'Consumidor final';
  const discount = saleData?.discount ? `<tr><td colspan="3" style="text-align:right">Descuento</td><td style="text-align:right;color:green">-S/. ${(saleData.subtotal * saleData.discount).toFixed(2)}</td></tr>` : '';

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

const PAYMENT_METHODS = [
  { key: 'digital', label: 'Billetera electrónica', sub: 'Yape · Plin · izipay' },
  { key: 'bank',    label: 'Transferencia Bancaria o CCI', sub: '' },
  { key: 'cash',    label: 'En efectivo', sub: '' },
];

const StepPago = ({ saleData, cart, onBack, theme, pageBg, headerBg }) => {
  const navigate = useNavigate();
  const { updateProducto, productos } = useInventario();
  const { empresa } = useEmpresa();

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
      items: cart.map(({ item, qty }) => ({
        id: item.id, nombre: item.nombre, precio: parseFloat(item.precio || 0), qty,
        _type: item._type,
      })),
      subtotal: cart.reduce((s, { item, qty }) => s + qty * parseFloat(item.precio || 0), 0),
      discount: saleData?.discount || 0,
      total: saleData?.total || 0,
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
    cart.forEach(({ item, qty }) => {
      if (item._type === 'Producto') {
        const cur = productos.find(p => p.id === item.id);
        if (cur) updateProducto(cur.id, { ...cur, stock: Math.max(0, (cur.stock || 0) - qty) });
      }
    });
  };

  const openTicket = () => {
    saveComprobante(); // persist before anything else
    const saleId = getSaleId();
    const html = buildTicketHTML(empresa, cart, saleData, selectedMethod, saleId);
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
    <div className={`flex flex-col h-full -m-6 ${pageBg}`}>
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
