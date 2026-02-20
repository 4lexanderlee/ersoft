import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useInventario } from '../../context/InventarioContext';
import { FaTimes } from 'react-icons/fa';
import { MdFileUpload } from 'react-icons/md';

const AddServicioPanel = ({ onClose, editItem = null, onSaved }) => {
  const { theme } = useTheme();
  const { categorias, addServicio, updateServicio } = useInventario();
  const imgRef = useRef(null);

  const [form, setForm] = useState(editItem || {
    nombre: '', precio: '', codigoDsct: '',
    vigenciaDesde: '', vigenciaHasta: '',
    categoria: '', imagen: null, descripcion: '',
  });

  const inputCls = theme === 'dark'
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500';
  const labelCls = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleImg = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, imagen: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precio) return;
    if (editItem) {
      updateServicio(editItem.id, form);
    } else {
      addServicio(form);
    }
    onSaved?.();
    onClose();
  };

  return (
    <div className={`h-full flex flex-col ${bg}`}>
      <div className={`flex items-center justify-between px-5 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className={`font-bold text-base italic ${text}`}>Agregar Servicio</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-red-400"><FaTimes /></button>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Nombre */}
        <div>
          <label className={`text-xs font-semibold uppercase ${labelCls}`}>Nombre <span className="text-red-500">*</span></label>
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="ej. Diseño de catálogo"
            className={`w-full mt-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} required />
        </div>

        {/* Precio */}
        <div>
          <label className={`text-xs font-semibold uppercase ${labelCls}`}>Precio <span className="text-red-500">*</span></label>
          <div className="relative mt-1">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>S/.</span>
            <input name="precio" type="number" step="0.01" value={form.precio} onChange={handleChange} placeholder="XXX.XX"
              className={`w-full pl-9 pr-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`} required />
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
          <label className={`text-xs font-semibold uppercase ${labelCls}`}>Categoría</label>
          <select name="categoria" value={form.categoria} onChange={handleChange}
            className={`w-full mt-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`}>
            <option value="">Seleccionar</option>
            {categorias.servicios.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Imagen */}
        <div>
          <label className={`text-xs font-semibold uppercase ${labelCls}`}>Imagen (opcional)</label>
          <div onClick={() => imgRef.current?.click()}
            className={`mt-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-6 cursor-pointer transition-colors
              ${theme === 'dark' ? 'border-gray-600 hover:border-gray-400' : 'border-gray-300 hover:border-gray-500'}`}>
            {form.imagen
              ? <img src={form.imagen} alt="preview" className="max-h-24 object-contain rounded-lg" />
              : <>
                  <MdFileUpload size={32} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Imagen del servicio</p>
                </>}
          </div>
          <input ref={imgRef} type="file" accept="image/*" onChange={handleImg} className="hidden" />
        </div>

        {/* Descripción */}
        <div>
          <label className={`text-xs font-semibold uppercase ${labelCls}`}>Descripción del Servicio</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={4}
            placeholder="Detalla qué incluye el servicio..."
            className={`w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 resize-none ${inputCls}`} />
        </div>

        <button type="submit"
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full transition-colors">
          {editItem ? 'Guardar Cambios' : 'Agregar Servicio'}
        </button>
      </form>
    </div>
  );
};

export default AddServicioPanel;
