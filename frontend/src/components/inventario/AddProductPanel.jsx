import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useInventario } from '../../context/InventarioContext';
import { FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import { MdFileUpload } from 'react-icons/md';

const AddProductPanel = ({ onClose, editItem = null }) => {
  const { theme } = useTheme();
  const { categorias, addProducto, updateProducto, lotes, incrementLoteCount } = useInventario();
  const { login, user } = useAuth();
  const imgRef = useRef(null);

  // Active lotes only
  const activeLotes = lotes.filter(l => l.estado === 'Activo');

  const [form, setForm] = useState(editItem
    ? { ...editItem, stock: String(editItem.stock ?? 1), loteId: editItem.loteId || '' }
    : {
        nombre: '', tipo: 'Producto', precio: '', codigoDsct: '',
        vigenciaDesde: '', vigenciaHasta: '', categoria: '',
        imagen: null, stock: '1', descripcion: '',
        loteId: activeLotes[0]?.id || '',
      }
  );
  const [stockError, setStockError] = useState('');
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImg = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, imagen: reader.result }));
    reader.readAsDataURL(file);
  };

  // Stock handlers — allow empty string while typing, validate on blur
  const handleStockChange = e => {
    setForm(prev => ({ ...prev, stock: e.target.value }));
    setStockError('');
  };
  const handleStockBlur = () => {
    const val = parseInt(form.stock);
    if (isNaN(val) || val < 1) {
      setForm(prev => ({ ...prev, stock: '1' }));
      setStockError('');
    }
  };
  const changeStock = (delta) => {
    const current = parseInt(form.stock) || 0;
    const next = Math.max(1, current + delta);
    setForm(prev => ({ ...prev, stock: String(next) }));
    setStockError('');
  };

  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputCls = theme === 'dark'
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500';
  const labelCls = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';

  const handleSave = (e) => {
    e.preventDefault();
    const stockNum = parseInt(form.stock);
    if (!form.nombre || !form.precio || !form.categoria) return;
    if (isNaN(stockNum) || stockNum < 1) {
      setStockError('El stock debe ser al menos 1');
      return;
    }
    if (!editItem && !form.loteId) {
      alert('Debes seleccionar un lote activo.');
      return;
    }
    setShowPwdModal(true);
  };

  const handlePwdConfirm = () => {
    const r = login(user.username, pwd);
    if (!r.success) { setPwdError('Contraseña incorrecta'); return; }
    const stockNum = parseInt(form.stock);
    if (editItem) {
      updateProducto(editItem.id, { ...form, stock: stockNum });
    } else {
      addProducto({ ...form, stock: stockNum });
      incrementLoteCount(form.loteId);
    }
    setShowPwdModal(false);
    onClose();
  };

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

          {/* Lot selector — only shown when creating, not editing */}
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
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>Nombre <span className="text-red-500">*</span></label>
            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="ej. Polo Estampado"
              className={`w-full mt-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} required />
          </div>

          {/* Tipo + Precio */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={`text-xs font-semibold uppercase ${labelCls}`}>Tipo <span className="text-red-500">*</span></label>
              <select name="tipo" value={form.tipo} onChange={handleChange}
                className={`w-full mt-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`}>
                <option>Producto</option>
                <option>Servicio</option>
              </select>
            </div>
            <div className="flex-1">
              <label className={`text-xs font-semibold uppercase ${labelCls}`}>Precio <span className="text-red-500">*</span></label>
              <div className="relative mt-1">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>S/.</span>
                <input name="precio" type="number" step="0.01" value={form.precio} onChange={handleChange} placeholder="0.00"
                  className={`w-full pl-9 pr-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} required />
              </div>
            </div>
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

          {/* Categoría */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>Categoría <span className="text-red-500">*</span></label>
            <select name="categoria" value={form.categoria} onChange={handleChange}
              className={`w-full mt-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} required>
              <option value="">Seleccionar</option>
              {categorias.productos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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

          {/* Stock — Fix 4: allows clearing to type manually, never goes below 1 */}
          <div>
            <label className={`text-xs font-semibold uppercase ${labelCls}`}>
              Stock <span className="text-red-500">*</span>
            </label>
            {stockError && <p className="text-red-400 text-xs mt-0.5">{stockError}</p>}
            <div className="flex items-center gap-3 mt-1">
              <button type="button" onClick={() => changeStock(-1)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                <FaMinus size={10} />
              </button>
              <input
                type="number"
                value={form.stock}
                onChange={handleStockChange}
                onBlur={handleStockBlur}
                min="1"
                className={`flex-1 px-3 py-2 border rounded-full text-sm text-center focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`}
              />
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
              placeholder="Contraseña" autoFocus
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
