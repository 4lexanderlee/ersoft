import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useInventario } from '../../context/InventarioContext';
import { useDS } from '../../hooks/useDS';
import {
  FaTimes,
  FaPlus,
  FaMinus,
  FaTags,
  FaTh,
  FaWeightHanging,
  FaBoxes,
  FaTrash,
  FaLayerGroup,
  FaBarcode,
} from 'react-icons/fa';
import { MdFileUpload } from 'react-icons/md';
import Btn from '../ui/Btn';
import Badge from '../ui/Badge';

const SUNAT_UNIDADES = [
  { codigo: 'NIU', label: 'NIU — Unidad (Entero)', decimales: false, icon: '📦' },
  { codigo: 'KGM', label: 'KGM — Kilogramo (Decimal)', decimales: true, icon: '⚖️' },
  { codigo: 'MTR', label: 'MTR — Metro (Decimal)', decimales: true, icon: '📏' },
  { codigo: 'LTR', label: 'LTR — Litro (Decimal)', decimales: true, icon: '🧪' },
];

const PRESET_TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42'];
const PRESET_COLORES = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Gris', 'Beige', 'Marino'];

const generateUniqueBarcode = () => {
  return '775' + String(Date.now()).slice(-6) + String(Math.floor(100 + Math.random() * 900));
};

const AddProductPanel = ({ onClose, editItem = null }) => {
  const { theme } = useTheme();
  const ds = useDS();
  const {
    arbolCategorias = [],
    addProducto,
    updateProducto,
    lotes,
    almacenes,
    incrementLoteCount,
    isBarcodeInUse,
  } = useInventario();
  const { verifyPassword, user } = useAuth();
  const imgRef = useRef(null);

  // Active lotes only - filtered by branch if not Master
  const activeLotes = lotes.filter(l => {
    if (l.estado !== 'Activo') return false;
    if (user?.role === 'Master' || user?.rol === 'MASTER') return true;
    const alm = almacenes.find(a => String(a.id) === String(l.almacenId));
    return alm && String(alm.sucursalId) === String(user?.sucursalId || user?.sucursal_id || '1');
  });

  // Normalize legacy categoria string -> array
  const normCats = (item) => {
    if (!item) return [];
    if (Array.isArray(item.categorias)) return item.categorias;
    if (item.categoria) return [item.categoria];
    return [];
  };

  const initialUM = editItem?.unidadMedida === 'Kilogramo' ? 'KGM' : (editItem?.unidadMedida || 'NIU');
  const initialTipoProducto = editItem?.tipoProducto || (editItem?.variantes?.length ? 'VARIANTES' : 'ESTANDAR');

  const [form, setForm] = useState(editItem
    ? {
        nombre: editItem.nombre || '',
        tipo: 'Producto',
        tipoProducto: initialTipoProducto,
        precio: String(editItem.precio ?? ''),
        costo: String(editItem.costo ?? '0'),
        unidadMedida: initialUM,
        permite_decimales: Boolean(editItem.permite_decimales || ['KGM', 'MTR', 'LTR'].includes(initialUM)),
        codigoBarras: editItem.codigoBarras || '',
        imagen: editItem.imagen || null,
        stock: String(editItem.stock ?? 1),
        descripcion: editItem.descripcion || '',
        loteId: editItem.loteId || activeLotes[0]?.id || 101,
        familia: editItem.familia || '',
        categoria: editItem.categoria || '',
        subcategoria: editItem.subcategoria || '',
        categorias: normCats(editItem),
      }
    : {
        nombre: '',
        tipo: 'Producto',
        tipoProducto: 'ESTANDAR',
        precio: '',
        costo: '0',
        unidadMedida: 'NIU',
        permite_decimales: false,
        codigoBarras: '',
        imagen: null,
        stock: '1',
        descripcion: '',
        loteId: activeLotes[0]?.id || 101,
        familia: arbolCategorias[0]?.nombre || '',
        categoria: arbolCategorias[0]?.categorias?.[0]?.nombre || '',
        subcategoria: arbolCategorias[0]?.categorias?.[0]?.subcategorias?.[0]?.nombre || '',
        categorias: [],
      }
  );

  // Variant Matrix state
  const [selectedTallas, setSelectedTallas] = useState(editItem?.tallas || ['S', 'M', 'L']);
  const [selectedColores, setSelectedColores] = useState(editItem?.colores || ['Negro', 'Blanco']);
  const [customTallaInput, setCustomTallaInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [variantes, setVariantes] = useState(editItem?.variantes || []);

  const [errors, setErrors] = useState({});
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState('');

  const isDecimal = form.permite_decimales;

  // Selected Familia object and its child categories
  const currentFamiliaObj = arbolCategorias.find(f => f.nombre === form.familia) || arbolCategorias[0] || null;
  const availableCategorias = currentFamiliaObj ? currentFamiliaObj.categorias || [] : [];
  const currentCategoriaObj = availableCategorias.find(c => c.nombre === form.categoria) || availableCategorias[0] || null;
  const availableSubcategorias = currentCategoriaObj ? currentCategoriaObj.subcategorias || [] : [];

  // When familia changes, adjust category and subcategory
  const handleFamiliaChange = (famNombre) => {
    const fam = arbolCategorias.find(f => f.nombre === famNombre);
    const firstCat = fam?.categorias?.[0]?.nombre || '';
    const firstSub = fam?.categorias?.[0]?.subcategorias?.[0]?.nombre || '';
    setForm(prev => ({
      ...prev,
      familia: famNombre,
      categoria: firstCat,
      subcategoria: firstSub,
      categorias: [firstCat, famNombre].filter(Boolean),
    }));
  };

  const handleCategoriaChange = (catNombre) => {
    const cat = availableCategorias.find(c => c.nombre === catNombre);
    const firstSub = cat?.subcategorias?.[0]?.nombre || '';
    setForm(prev => ({
      ...prev,
      categoria: catNombre,
      subcategoria: firstSub,
      categorias: [catNombre, prev.familia].filter(Boolean),
    }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUMChange = (e) => {
    const um = e.target.value;
    const targetConfig = SUNAT_UNIDADES.find(u => u.codigo === um);
    const dec = Boolean(targetConfig?.decimales);
    setForm(prev => ({
      ...prev,
      unidadMedida: um,
      permite_decimales: dec,
      stock: dec ? (parseFloat(prev.stock) || 0.001).toFixed(3) : String(Math.max(1, parseInt(prev.stock, 10) || 1)),
    }));
  };

  const handleImg = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, imagen: reader.result }));
    reader.readAsDataURL(file);
  };

  // Stock handlers for standard product
  const handleStockChange = e => {
    setForm(prev => ({ ...prev, stock: e.target.value }));
    setErrors(prev => { const n = { ...prev }; delete n.stock; return n; });
  };

  const changeStock = delta => {
    const step = isDecimal ? 0.5 : 1;
    const current = isDecimal ? (parseFloat(form.stock) || 0) : (parseInt(form.stock, 10) || 0);
    const next = Math.max(isDecimal ? 0.001 : 1, current + delta * step);
    setForm(prev => ({ ...prev, stock: isDecimal ? next.toFixed(3) : String(next) }));
  };

  // Variant Matrix generation
  const generateMatrix = () => {
    if (selectedTallas.length === 0 || selectedColores.length === 0) {
      alert('Debes seleccionar al menos una talla y un color para generar la matriz.');
      return;
    }

    const defaultPrice = parseFloat(form.precio) || 0;
    const defaultCost = parseFloat(form.costo) || 0;
    const prefix = (form.nombre.trim() ? form.nombre.trim().slice(0, 4).toUpperCase() : 'PROD').replace(/\s+/g, '');

    const newMatrix = [];
    selectedTallas.forEach(talla => {
      selectedColores.forEach(color => {
        // check if already exists
        const existing = variantes.find(v => v.talla === talla && v.color === color);
        if (existing) {
          newMatrix.push(existing);
        } else {
          newMatrix.push({
            id: `var-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sku: `${prefix}-${talla.toUpperCase()}-${color.slice(0, 3).toUpperCase()}`,
            barcode: generateUniqueBarcode(),
            talla,
            color,
            stock: 10,
            precio: defaultPrice,
            costo: defaultCost,
            loteId: Number(form.loteId) || 101,
          });
        }
      });
    });

    setVariantes(newMatrix);
  };

  const updateVariantRow = (id, field, value) => {
    setVariantes(prev => prev.map(v => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const deleteVariantRow = (id) => {
    setVariantes(prev => prev.filter(v => v.id !== id));
  };

  // Total stock derived for variants or standard
  const totalVariantStock = form.tipoProducto === 'VARIANTES'
    ? variantes.reduce((acc, v) => acc + (parseFloat(v.stock) || 0), 0)
    : (isDecimal ? (parseFloat(form.stock) || 0) : (parseInt(form.stock, 10) || 0));

  // Validation
  const validate = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.precio || isNaN(parseFloat(form.precio)) || parseFloat(form.precio) < 0) {
      errs.precio = 'Precio inválido';
    }
    if (!form.costo || isNaN(parseFloat(form.costo)) || parseFloat(form.costo) < 0) {
      errs.costo = 'Costo inválido';
    }

    // Barcode validation
    if (form.codigoBarras && form.codigoBarras.trim() !== '') {
      if (!/^\d{6,}$/.test(form.codigoBarras.trim())) {
        errs.codigoBarras = 'Mínimo 6 dígitos numéricos';
      } else if (isBarcodeInUse(form.codigoBarras.trim(), editItem?.id)) {
        errs.codigoBarras = 'Este código de barras ya está en uso';
      }
    }

    if (form.tipoProducto === 'ESTANDAR') {
      const numStock = parseFloat(form.stock);
      if (isNaN(numStock) || numStock <= 0) {
        errs.stock = isDecimal ? 'Stock debe ser mayor a 0 (decimal permitido)' : 'Stock debe ser al menos 1 unidad';
      }
    } else {
      if (variantes.length === 0) {
        errs.variantes = 'Debes generar o agregar al menos una variante en la matriz';
      }
    }

    return errs;
  };

  const handleSave = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setShowPwdModal(true);
  };

  const handlePwdConfirm = () => {
    if (!verifyPassword(pwd)) {
      setPwdError('Contraseña incorrecta');
      return;
    }

    const isDec = form.permite_decimales;
    const finalStock = form.tipoProducto === 'VARIANTES'
      ? totalVariantStock
      : (isDec ? parseFloat(form.stock) || 0 : parseInt(form.stock, 10) || 0);

    const payload = {
      ...form,
      precio: parseFloat(form.precio) || 0,
      costo: parseFloat(form.costo) || 0,
      stock: finalStock,
      permite_decimales: isDec,
      loteId: Number(form.loteId) || 101,
      codigoBarras: form.codigoBarras ? form.codigoBarras.trim() : null,
      tallas: form.tipoProducto === 'VARIANTES' ? selectedTallas : [],
      colores: form.tipoProducto === 'VARIANTES' ? selectedColores : [],
      variantes: form.tipoProducto === 'VARIANTES' ? variantes : [],
    };

    if (editItem) {
      updateProducto(editItem.id, payload);
    } else {
      addProducto(payload);
      if (form.loteId) incrementLoteCount(Number(form.loteId));
    }

    setShowPwdModal(false);
    onClose();
  };

  return (
    <>
      <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <FaBoxes className="text-yellow-500" size={18} />
            <h2 className={`font-bold text-base italic ${ds.text}`}>
              {editItem ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400 transition-colors">
            <FaTimes size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Product Type Selector (Pills) */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${ds.muted}`}>
              Tipo de Producto Físico
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, tipoProducto: 'ESTANDAR' }))}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  form.tipoProducto === 'ESTANDAR'
                    ? 'bg-yellow-500 text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FaWeightHanging size={12} /> Estándar / Por Peso
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, tipoProducto: 'VARIANTES' }))}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  form.tipoProducto === 'VARIANTES'
                    ? 'bg-yellow-500 text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FaTh size={12} /> Con Variantes (Talla/Color)
              </button>
            </div>
          </div>

          {/* 3-Level Hierarchy Selectors */}
          <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <FaLayerGroup className="text-yellow-500" size={14} />
              <span className={`text-xs font-bold uppercase tracking-wider ${ds.text}`}>
                Clasificación Jerárquica Logística (3 Niveles)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Familia */}
              <div>
                <label className={`text-[11px] font-semibold uppercase ${ds.muted}`}>1. Familia</label>
                <select
                  value={form.familia}
                  onChange={e => handleFamiliaChange(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-xl text-xs border outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                >
                  {arbolCategorias.map(f => (
                    <option key={f.id} value={f.nombre}>{f.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Categoría */}
              <div>
                <label className={`text-[11px] font-semibold uppercase ${ds.muted}`}>2. Categoría</label>
                <select
                  value={form.categoria}
                  onChange={e => handleCategoriaChange(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-xl text-xs border outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                >
                  {availableCategorias.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Subcategoría */}
              <div>
                <label className={`text-[11px] font-semibold uppercase ${ds.muted}`}>3. Subcategoría</label>
                <select
                  value={form.subcategoria}
                  onChange={e => setForm(p => ({ ...p, subcategoria: e.target.value }))}
                  className={`w-full mt-1 px-3 py-2 rounded-xl text-xs border outline-none focus:ring-1 focus:ring-yellow-500 ${ds.inputCls}`}
                >
                  {availableSubcategorias.map(s => (
                    <option key={s.id} value={s.nombre}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Nombre & Lote */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className={`text-xs font-semibold uppercase ${ds.muted}`}>
                Nombre del Producto <span className="text-red-500">*</span>
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="ej. Polo Piqué Algodón / Tela Jersey..."
                className={`w-full mt-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls} ${errors.nombre ? 'border-red-500' : ''}`}
              />
              {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <label className={`text-xs font-semibold uppercase ${ds.muted}`}>
                Lote Activo <span className="text-red-500">*</span>
              </label>
              <select
                name="loteId"
                value={form.loteId}
                onChange={handleChange}
                className={`w-full mt-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
              >
                {activeLotes.map(l => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Precio, Costo, Unidad SUNAT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`text-xs font-semibold uppercase ${ds.muted}`}>
                Precio Venta (S/.) <span className="text-red-500">*</span>
              </label>
              <input
                name="precio"
                type="number"
                step="0.01"
                value={form.precio}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full mt-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls} ${errors.precio ? 'border-red-500' : ''}`}
              />
              {errors.precio && <p className="text-red-400 text-xs mt-1">{errors.precio}</p>}
            </div>

            <div>
              <label className={`text-xs font-semibold uppercase ${ds.muted}`}>
                Costo Compra (S/.) <span className="text-red-500">*</span>
              </label>
              <input
                name="costo"
                type="number"
                step="0.01"
                value={form.costo}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full mt-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls} ${errors.costo ? 'border-red-500' : ''}`}
              />
              {errors.costo && <p className="text-red-400 text-xs mt-1">{errors.costo}</p>}
            </div>

            <div>
              <label className={`text-xs font-semibold uppercase ${ds.muted}`}>
                Unidad Medida SUNAT
              </label>
              <select
                name="unidadMedida"
                value={form.unidadMedida}
                onChange={handleUMChange}
                className={`w-full mt-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
              >
                {SUNAT_UNIDADES.map(u => (
                  <option key={u.codigo} value={u.codigo}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Código de barras del Producto Padre */}
          <div>
            <div className="flex justify-between items-center">
              <label className={`text-xs font-semibold uppercase ${ds.muted}`}>
                Código de Barras Padre <span className="text-[10px] font-normal">(Opcional)</span>
              </label>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, codigoBarras: generateUniqueBarcode() }))}
                className="text-xs text-yellow-500 hover:underline flex items-center gap-1"
              >
                <FaBarcode size={10} /> Autogenerar
              </button>
            </div>
            <input
              name="codigoBarras"
              value={form.codigoBarras}
              onChange={e => setForm(p => ({ ...p, codigoBarras: e.target.value.replace(/\D/g, '') }))}
              placeholder="Identificador único numérico (mín. 6 dígitos)"
              maxLength={20}
              className={`w-full mt-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls} ${errors.codigoBarras ? 'border-red-500' : ''}`}
            />
            {errors.codigoBarras && <p className="text-red-400 text-xs mt-1">{errors.codigoBarras}</p>}
          </div>

          {/* SECTION: Standard Product Stock */}
          {form.tipoProducto === 'ESTANDAR' && (
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${ds.text}`}>
                  {isDecimal ? `Stock Físico Fraccionado (${form.unidadMedida})` : 'Stock Físico (Unidades)'}
                </label>
                {isDecimal && (
                  <span className="text-xs font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    permite_decimales: true (Paso 0.001)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => changeStock(-1)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                    theme === 'dark' ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <FaMinus size={11} />
                </button>
                <input
                  type="number"
                  value={form.stock}
                  onChange={handleStockChange}
                  min={isDecimal ? '0.001' : '1'}
                  step={isDecimal ? '0.001' : '1'}
                  placeholder={isDecimal ? '25.500' : '10'}
                  className={`flex-1 px-3 py-2 border rounded-xl text-sm text-center font-bold outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
                />
                <button
                  type="button"
                  onClick={() => changeStock(1)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                    theme === 'dark' ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <FaPlus size={11} />
                </button>
              </div>
              {errors.stock && <p className="text-red-400 text-xs mt-1">{errors.stock}</p>}
            </div>
          )}

          {/* SECTION: Product with Variants (Matrix Size / Color) */}
          {form.tipoProducto === 'VARIANTES' && (
            <div className={`p-4 rounded-2xl border space-y-4 ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaTh className="text-yellow-500" size={14} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${ds.text}`}>
                    Constructor de Matriz (Tallas y Colores)
                  </span>
                </div>
                <Btn type="button" size="sm" variant="primary" onClick={generateMatrix} className="bg-yellow-500! text-black! hover:bg-yellow-400!">
                  Generar Combinaciones
                </Btn>
              </div>

              {/* Tallas Selector */}
              <div>
                <label className={`text-[11px] font-semibold uppercase mb-1 block ${ds.muted}`}>
                  Tallas a Incluir:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_TALLAS.map(talla => {
                    const active = selectedTallas.includes(talla);
                    return (
                      <button
                        key={talla}
                        type="button"
                        onClick={() => {
                          setSelectedTallas(prev => prev.includes(talla) ? prev.filter(t => t !== talla) : [...prev, talla]);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-colors ${
                          active
                            ? 'bg-yellow-500 text-black border-yellow-500'
                            : theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                        }`}
                      >
                        {talla}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customTallaInput}
                    onChange={e => setCustomTallaInput(e.target.value)}
                    placeholder="Agregar otra talla personalizada..."
                    className={`flex-1 px-3 py-1.5 text-xs rounded-xl border outline-none ${ds.inputCls}`}
                  />
                  <Btn
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (customTallaInput.trim() && !selectedTallas.includes(customTallaInput.trim())) {
                        setSelectedTallas([...selectedTallas, customTallaInput.trim()]);
                        setCustomTallaInput('');
                      }
                    }}
                  >
                    + Añadir
                  </Btn>
                </div>
              </div>

              {/* Colores Selector */}
              <div>
                <label className={`text-[11px] font-semibold uppercase mb-1 block ${ds.muted}`}>
                  Colores a Incluir:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_COLORES.map(color => {
                    const active = selectedColores.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColores(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-colors ${
                          active
                            ? 'bg-yellow-500 text-black border-yellow-500'
                            : theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customColorInput}
                    onChange={e => setCustomColorInput(e.target.value)}
                    placeholder="Agregar otro color personalizado..."
                    className={`flex-1 px-3 py-1.5 text-xs rounded-xl border outline-none ${ds.inputCls}`}
                  />
                  <Btn
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (customColorInput.trim() && !selectedColores.includes(customColorInput.trim())) {
                        setSelectedColores([...selectedColores, customColorInput.trim()]);
                        setCustomColorInput('');
                      }
                    }}
                  >
                    + Añadir
                  </Btn>
                </div>
              </div>

              {/* Matrix Table */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-xs font-bold uppercase ${ds.text}`}>
                    SKUs Hijos Generados ({variantes.length})
                  </span>
                  <span className="text-xs font-bold text-yellow-500">
                    Stock Total Consolidado: {form.stock} unid.
                  </span>
                </div>

                {errors.variantes && <p className="text-red-400 text-xs mb-2">{errors.variantes}</p>}

                {variantes.length === 0 ? (
                  <p className={`text-xs italic py-4 text-center border border-dashed rounded-xl ${ds.muted}`}>
                    Presiona "Generar Combinaciones" para crear la matriz de variantes.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className={theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}>
                        <tr>
                          <th className="py-2 px-2 text-left">Talla</th>
                          <th className="py-2 px-2 text-left">Color</th>
                          <th className="py-2 px-2 text-left">SKU Hijo</th>
                          <th className="py-2 px-2 text-left">Cód. Barras</th>
                          <th className="py-2 px-2 text-center w-20">Stock</th>
                          <th className="py-2 px-2 text-center w-20">Precio S/.</th>
                          <th className="py-2 px-2 text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantes.map(v => (
                          <tr key={v.id} className="border-t border-gray-200 dark:border-gray-700/60">
                            <td className="py-1.5 px-2 font-bold">{v.talla}</td>
                            <td className="py-1.5 px-2">{v.color}</td>
                            <td className="py-1.5 px-2">
                              <input
                                value={v.sku}
                                onChange={e => updateVariantRow(v.id, 'sku', e.target.value)}
                                className={`w-28 px-1.5 py-0.5 border rounded text-[11px] ${ds.inputCls}`}
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                value={v.barcode}
                                onChange={e => updateVariantRow(v.id, 'barcode', e.target.value)}
                                className={`w-28 px-1.5 py-0.5 border rounded text-[11px] ${ds.inputCls}`}
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={e => updateVariantRow(v.id, 'stock', parseInt(e.target.value, 10) || 0)}
                                className={`w-16 px-1 py-0.5 text-center font-bold border rounded ${ds.inputCls}`}
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="number"
                                step="0.01"
                                value={v.precio}
                                onChange={e => updateVariantRow(v.id, 'precio', parseFloat(e.target.value) || 0)}
                                className={`w-16 px-1 py-0.5 text-center border rounded ${ds.inputCls}`}
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => deleteVariantRow(v.id)}
                                className="text-red-400 hover:text-red-500 p-1"
                              >
                                <FaTrash size={10} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Imagen */}
          <div>
            <label className={`text-xs font-semibold uppercase ${ds.muted}`}>Imagen del Producto</label>
            <div
              onClick={() => imgRef.current?.click()}
              className={`mt-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-6 cursor-pointer transition-colors ${
                theme === 'dark' ? 'border-gray-600 hover:border-gray-400' : 'border-gray-300 hover:border-gray-500'
              }`}
            >
              {form.imagen ? (
                <img src={form.imagen} alt="preview" className="max-h-28 object-contain rounded-lg" />
              ) : (
                <>
                  <MdFileUpload size={32} className={ds.subtle} />
                  <p className={`text-xs mt-1 ${ds.subtle}`}>Subir imagen PNG o JPG</p>
                </>
              )}
            </div>
            <input ref={imgRef} type="file" accept="image/*" onChange={handleImg} className="hidden" />
            {form.imagen && (
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, imagen: null }))}
                className="text-xs text-red-400 hover:text-red-300 mt-1"
              >
                Eliminar imagen
              </button>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className={`text-xs font-semibold uppercase ${ds.muted}`}>Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={2}
              className={`w-full mt-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 resize-none ${ds.inputCls}`}
              placeholder="Detalles técnicos, materiales o notas de inventario..."
            />
          </div>

          {/* Submit button */}
          <Btn
            type="submit"
            fullWidth
            size="lg"
            variant="primary"
            className="bg-yellow-500! text-black! hover:bg-yellow-400! font-bold text-sm"
          >
            {editItem ? 'Guardar Cambios' : 'Registrar en Catálogo'}
          </Btn>
        </form>
      </div>

      {/* Password Confirmation Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className={`w-full max-w-xs rounded-2xl shadow-2xl p-6 flex flex-col gap-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <h3 className="font-bold text-center">Confirmar con Contraseña</h3>
            <p className={`text-xs text-center ${ds.muted}`}>
              Confirma tus credenciales para registrar o actualizar este producto en el catálogo.
            </p>
            {pwdError && <p className="text-red-400 text-sm text-center">{pwdError}</p>}
            <input
              type="password"
              value={pwd}
              onChange={e => { setPwd(e.target.value); setPwdError(''); }}
              placeholder="Tu contraseña"
              autoFocus
              className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${ds.inputCls}`}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowPwdModal(false); setPwd(''); setPwdError(''); }}
                className={`flex-1 py-2 rounded-xl border font-semibold text-sm ${
                  theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePwdConfirm}
                className="flex-1 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddProductPanel;

