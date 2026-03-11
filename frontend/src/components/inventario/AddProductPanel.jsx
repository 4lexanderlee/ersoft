import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useInventario } from '../../context/InventarioContext';
import { FaTimes, FaPlus, FaMinus, FaTags } from 'react-icons/fa';
import { MdFileUpload } from 'react-icons/md';

const MAX_CATEGORIAS = 3;

const AddProductPanel = ({ onClose, editItem = null }) => {
  const { theme } = useTheme();
  const { categorias, addProducto, updateProducto, lotes, incrementLoteCount, isBarcodeInUse } = useInventario();
  const { login, user } = useAuth();
  const imgRef = useRef(null);

  // Active lotes only
  const activeLotes = lotes.filter(l => l.estado === 'Activo');

  // Normalize legacy categoria string → array
  const normCats = (item) => {
    if (!item) return [];
    if (Array.isArray(item.categorias)) return item.categorias;
    if (item.categoria) return [item.categoria];
    return [];
  };

  const [form, setForm] = useState(editItem
    ? {
        nombre: editItem.nombre || '',
        tipo: 'Producto',
        precio: editItem.precio || '',
        codigoDsct: editItem.codigoDsct || '',
        codigoBarras: editItem.codigoBarras || '',
        vigenciaDesde: editItem.vigenciaDesde || '',
        vigenciaHasta: editItem.vigenciaHasta || '',
        imagen: editItem.imagen || null,
        stock: String(editItem.stock ?? 1),
        descripcion: editItem.descripcion || '',
        loteId: editItem.loteId || '',
        categorias: normCats(editItem),
      }
    : {
        nombre: '', tipo: 'Producto', precio: '', codigoDsct: '',
        codigoBarras: '',
        vigenciaDesde: '', vigenciaHasta: '',
        imagen: null, stock: '1', descripcion: '',
        loteId: activeLotes[0]?.id || '',
        categorias: [],
      }
  );

  const [errors, setErrors] = useState({});
  const [stockError, setStockError] = useState('');
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState('');

  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputCls = theme === 'dark'
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500';
  const labelCls = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImg = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, imagen: reader.result }));
    reader.readAsDataURL(file);
  };

  // Stock handlers
  const handleStockChange = e => { setForm(prev => ({ ...prev, stock: e.target.value })); setStockError(''); };
  const handleStockBlur = () => {
    const val = parseInt(form.stock);
    if (isNaN(val) || val < 1) { setForm(prev => ({ ...prev, stock: '1' })); setStockError(''); }
  };
  const changeStock = delta => {
    const next = Math.max(1, (parseInt(form.stock) || 0) + delta);
    setForm(prev => ({ ...prev, stock: String(next) }));
    setStockError('');
  };

  // Multi-category handlers
  const toggleCategoria = (cat) => {
    setForm(prev => {
      const current = prev.categorias;
      if (current.includes(cat)) return { ...prev, categorias: current.filter(c => c !== cat) };
      if (current.length >= MAX_CATEGORIAS) return prev; // max 3
      return { ...prev, categorias: [...current, cat] };
    });
    setErrors(prev => { const n = { ...prev }; delete n.categorias; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.precio || isNaN(parseFloat(form.precio))) errs.precio = 'Precio inválido';
    if (form.categorias.length === 0) errs.categorias = 'Selecciona al menos una categoría';
    if (!editItem && !form.loteId) errs.loteId = 'Selecciona un lote';

    // Barcode validation
    if (form.codigoBarras.trim() !== '') {
      if (!/^\d{6,}$/.test(form.codigoBarras.trim())) {
        errs.codigoBarras = 'Mínimo 6 dígitos numéricos';
      } else if (isBarcodeInUse(form.codigoBarras.trim(), editItem?.id)) {
        errs.codigoBarras = 'Este código de barras ya está en uso por otro producto';
      }
    }

    const stockNum = parseInt(form.stock);
    if (isNaN(stockNum) || stockNum < 1) errs.stock = 'El stock debe ser al menos 1';

    return errs;
  };

  const handleSave = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setShowPwdModal(true);
  };

  const handlePwdConfirm = () => {
    const r = login(user.username, pwd);
    if (!r.success) { setPwdError('Contraseña incorrecta'); return; }
    const stockNum = parseInt(form.stock);
    const payload = {
      ...form,
      stock: stockNum,
      codigoBarras: form.codigoBarras.trim() || null,
      // Remove legacy field if present
      categoria: undefined,
    };
    if (editItem) {
      updateProducto(editItem.id, payload);
    } else {
      addProducto(payload);
      incrementLoteCount(form.loteId);
    }
    setShowPwdModal(false);
    onClose();
  };

  const chipBase = 'px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-colors select-none';
  const chipActive = 'bg-yellow-500 border-yellow-500 text-black';
  const chipInactive = theme === 'dark'
    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-yellow-500'
    : 'bg-gray-100 border-gray-300 text-gray-600 hover:border-yellow-500';

  return (
    <>
      <div className={`h-full flex flex-col ${bg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`font-bold text-base italic ${text}`}>
            {editItem ? 'Editar Producto' : 'Agregar Producto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400"><FaTimes /></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Lot selector — only shown when creating */}
          {!editItem && (
            <div>
              <label className={`text-xs font-semibold uppercase ${labelCls}`}>
                Lote <span className="text-red-500">*</span>
              </label>
              {activeLotes.length === 0 ? (
                <p className="text-red-400 text-xs mt-1">No hay lotes activos. Crea uno desde "Crear Lotes".</p>
              ) : (
                <select name="loteId" value={form.loteId} onChange={handleChange}
                  className={`w-full mt-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} required>
                  {activeLotes.map(l => (
                    <option key={l.id} value={l.id}>{l.nombre}</option>
                  ))}
                </select>
              )}
              {errors.loteId && <p className="text-red-400 text-xs mt-1">{errors.loteId}</p>}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>Nombre <span className="text-red-500">*</span></label>
            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="ej. Polo Estampado"
              className={`w-full mt-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls} ${errors.nombre ? 'border-red-500' : ''}`} />
            {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
          </div>

          {/* Precio */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>Precio <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>S/.</span>
              <input name="precio" type="number" step="0.01" value={form.precio} onChange={handleChange} placeholder="0.00"
                className={`w-full pl-9 pr-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls} ${errors.precio ? 'border-red-500' : ''}`} />
            </div>
            {errors.precio && <p className="text-red-400 text-xs mt-1">{errors.precio}</p>}
          </div>

          {/* Código de Barras (optional) */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>
              Código de Barras <span className={`text-xs font-normal ml-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>(opcional)</span>
            </label>
            <input
              name="codigoBarras"
              value={form.codigoBarras}
              onChange={e => {
                // Only allow digits
                const val = e.target.value.replace(/\D/g, '');
                setForm(prev => ({ ...prev, codigoBarras: val }));
                setErrors(prev => { const n = { ...prev }; delete n.codigoBarras; return n; });
              }}
              placeholder="Mín. 6 dígitos (identificador único)"
              maxLength={20}
              className={`w-full mt-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls} ${errors.codigoBarras ? 'border-red-500' : ''}`}
            />
            {errors.codigoBarras && <p className="text-red-400 text-xs mt-1">{errors.codigoBarras}</p>}
          </div>

          {/* Código DSCT */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>Código DSCT</label>
            <input name="codigoDsct" value={form.codigoDsct} onChange={handleChange} placeholder="ej. PROMO25"
              className={`w-full mt-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} />
          </div>

          {/* Vigencia */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>Vigencia</label>
            <div className="flex gap-3 mt-1">
              <input type="date" name="vigenciaDesde" value={form.vigenciaDesde} onChange={handleChange}
                className={`flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} />
              <input type="date" name="vigenciaHasta" value={form.vigenciaHasta} onChange={handleChange}
                className={`flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} />
            </div>
          </div>

          {/* Categorías — multi-select chips (max 3) */}
          <div>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold uppercase ${labelCls}`}>
                Categoría <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                <FaTags size={10} className="inline mr-1" />
                {form.categorias.length}/{MAX_CATEGORIAS}
              </span>
            </div>
            {errors.categorias && <p className="text-red-400 text-xs mt-0.5">{errors.categorias}</p>}
            {categorias.productos.length === 0 ? (
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                Sin categorías. Crea categorías primero.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {categorias.productos.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategoria(cat)}
                    disabled={!form.categorias.includes(cat) && form.categorias.length >= MAX_CATEGORIAS}
                    className={`${chipBase} ${form.categorias.includes(cat) ? chipActive : chipInactive}
                      disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Imagen */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>Imagen</label>
            <div onClick={() => imgRef.current?.click()}
              className={`mt-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-6 cursor-pointer transition-colors
                ${theme === 'dark' ? 'border-gray-600 hover:border-gray-400' : 'border-gray-300 hover:border-gray-500'}`}>
              {form.imagen
                ? <img src={form.imagen} alt="preview" className="max-h-28 object-contain rounded-lg" />
                : <>
                    <MdFileUpload size={36} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Sube o carga tu imagen aquí</p>
                  </>}
            </div>
            <input ref={imgRef} type="file" accept="image/*" onChange={handleImg} className="hidden" />
            {form.imagen && (
              <button type="button" onClick={() => setForm(p => ({ ...p, imagen: null }))}
                className="text-xs text-red-400 hover:text-red-300 mt-1">Eliminar imagen</button>
            )}
          </div>

          {/* Stock */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>
              Stock <span className="text-red-500">*</span>
            </label>
            {(stockError || errors.stock) && <p className="text-red-400 text-xs mt-0.5">{stockError || errors.stock}</p>}
            <div className="flex items-center gap-3 mt-1">
              <button type="button" onClick={() => changeStock(-1)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                <FaMinus size={10} />
              </button>
              <input type="number" value={form.stock} onChange={handleStockChange} onBlur={handleStockBlur} min="1"
                className={`flex-1 px-3 py-2 border rounded-full text-sm text-center focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} />
              <button type="button" onClick={() => changeStock(1)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                <FaPlus size={10} />
              </button>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3}
              className={`w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 resize-none ${inputCls}`} />
          </div>

          <button type="submit"
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full transition-colors">
            {editItem ? 'Guardar Cambios' : 'Agregar Producto'}
          </button>
        </form>
      </div>

      {/* Password Modal */}
      {showPwdModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className={`w-full max-w-xs rounded-2xl shadow-2xl p-6 flex flex-col gap-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <h3 className="font-bold text-center">Confirmar con contraseña</h3>
            {pwdError && <p className="text-red-400 text-sm text-center">{pwdError}</p>}
            <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setPwdError(''); }}
              placeholder="Contraseña del master" autoFocus
              className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputCls}`} />
            <div className="flex gap-3">
              <button onClick={() => { setShowPwdModal(false); setPwd(''); setPwdError(''); }}
                className={`flex-1 py-2 rounded-xl border font-semibold text-sm ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                Cancelar
              </button>
              <button onClick={handlePwdConfirm}
                className="flex-1 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm">
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
