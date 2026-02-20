import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useEmpresa } from '../context/EmpresaContext';
import {
  FaPencilAlt, FaSave, FaTimes, FaBuilding, FaFileInvoiceDollar,
  FaQrcode, FaUpload, FaArrowLeft,
} from 'react-icons/fa';

/* ---------- Reusable sub-components ---------- */

const SectionTitle = ({ icon: Icon, title, theme }) => (
  <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${theme === 'dark' ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}>
    <Icon className="text-yellow-500" />
    <h2 className="font-bold text-base uppercase tracking-wider">{title}</h2>
  </div>
);

const Field = ({ label, name, value, editing, onChange, type = 'text', textarea, theme }) => {
  const labelCls = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const valueCls = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const inputCls = theme === 'dark'
    ? 'bg-gray-700 border-gray-600 text-white focus:border-yellow-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-yellow-500';

  return (
    <div className="flex flex-col gap-1">
      <label className={`text-xs uppercase tracking-wider font-semibold ${labelCls}`}>{label}</label>
      {editing ? (
        textarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows={2}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 resize-none ${inputCls}`}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 ${inputCls}`}
          />
        )
      ) : (
        <p className={`text-sm font-medium ${valueCls}`}>{value || '—'}</p>
      )}
    </div>
  );
};

/* ---------- Confirm change modal ---------- */
const ConfirmModal = ({ onConfirm, onCancel, theme }) => {
  const overlay = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
  const cardCls = theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  return (
    <div className={overlay}>
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 ${cardCls}`}>
        <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <FaSave className="text-yellow-500 text-2xl" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold mb-1">¿Estás seguro de los cambios?</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Esta acción actualizará los datos de la empresa. A continuación deberás confirmar con tu clave.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={onCancel} className={`flex-1 py-2 rounded-xl border font-semibold transition-colors ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-colors">
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Password confirmation modal ---------- */
const PasswordModal = ({ onConfirm, onCancel, theme }) => {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();

  const cardCls = theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const inputCls = theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(user.username, pwd);
    if (result.success) {
      onConfirm();
    } else {
      setError('Contraseña incorrecta. Inténtalo nuevamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col gap-5 ${cardCls}`}>
        <h3 className="text-lg font-bold text-center">Confirmar identidad</h3>
        <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Ingresa tu contraseña para aplicar los cambios.
        </p>
        {error && (
          <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-xl">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(''); }}
            placeholder="Contraseña"
            autoFocus
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${inputCls}`}
          />
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className={`flex-1 py-2 rounded-xl border font-semibold transition-colors ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- Main Empresa Page ---------- */
const Empresa = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { empresa, updateEmpresa } = useEmpresa();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(empresa);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const qrInputRef = useRef(null);

  const pageBg = theme === 'dark' ? 'bg-[#313b48]' : 'bg-[#d6d0d4]';
  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headerBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-[#e8e3e8] border-gray-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, qrPath: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmed = () => {
    setShowConfirm(false);
    setShowPassword(true);
  };

  const handlePasswordConfirmed = () => {
    updateEmpresa(form);
    setShowPassword(false);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setForm(empresa);
    setEditing(false);
  };

  return (
    <div className={`flex flex-col min-h-full -m-6 ${pageBg}`}>

      {/* Header */}
      <div className={`flex items-center justify-between px-8 py-4 border-b ${headerBg}`}>
        <button onClick={() => navigate('/principal')} className={`flex items-center gap-2 font-bold text-lg hover:opacity-70 transition-colors ${textPrimary}`}>
          <FaArrowLeft />
          Volver al menú
        </button>

        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-colors ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                <FaTimes /> Cancelar
              </button>
              <button
                onClick={handleSaveClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors"
              >
                <FaSave /> Guardar Cambios
              </button>
            </>
          ) : (
            <button
              onClick={() => { setForm(empresa); setEditing(true); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors
                ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'}`}
            >
              <FaPencilAlt /> Editar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-5 px-10 py-6 max-w-4xl mx-auto w-full">

        {/* Card 1: Datos Generales */}
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
          <SectionTitle icon={FaBuilding} title="Datos Generales de la Empresa" theme={theme} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Razón Social" name="razonSocial" value={form.razonSocial} editing={editing} onChange={handleChange} theme={theme} />
            <Field label="Nombre Comercial" name="nombreComercial" value={form.nombreComercial} editing={editing} onChange={handleChange} theme={theme} />
            <Field label="RUC" name="ruc" value={form.ruc} editing={editing} onChange={handleChange} theme={theme} />
            <Field label="Tipo de Empresa" name="tipoEmpresa" value={form.tipoEmpresa} editing={editing} onChange={handleChange} theme={theme} />
            <div className="md:col-span-2">
              <Field label="Giro de Negocio" name="giroNegocio" value={form.giroNegocio} editing={editing} onChange={handleChange} theme={theme} textarea />
            </div>
            <Field label="Representante Legal" name="representanteLegal" value={form.representanteLegal} editing={editing} onChange={handleChange} theme={theme} />
          </div>
        </div>

        {/* Card 2: Ubicación y Contacto */}
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
          <SectionTitle icon={FaBuilding} title="Ubicación y Contacto" theme={theme} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Departamento" name="departamento" value={form.departamento} editing={editing} onChange={handleChange} theme={theme} />
            <Field label="Provincia" name="provincia" value={form.provincia} editing={editing} onChange={handleChange} theme={theme} />
            <Field label="Distrito" name="distrito" value={form.distrito} editing={editing} onChange={handleChange} theme={theme} />
            <div className="md:col-span-3">
              <Field label="Dirección" name="direccion" value={form.direccion} editing={editing} onChange={handleChange} theme={theme} />
            </div>
            <Field label="Teléfono Fijo" name="telefono" value={form.telefono} editing={editing} onChange={handleChange} theme={theme} />
            <Field label="Celular" name="celular" value={form.celular} editing={editing} onChange={handleChange} theme={theme} />
            <Field label="Email" name="email" value={form.email} editing={editing} onChange={handleChange} type="email" theme={theme} />
            <Field label="Sitio Web" name="web" value={form.web} editing={editing} onChange={handleChange} theme={theme} />
          </div>
        </div>

        {/* Card 3: Datos de Facturación */}
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
          <SectionTitle icon={FaFileInvoiceDollar} title="Datos de Facturación" theme={theme} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Serie de Facturas" name="serieFactura" value={form.serieFactura} editing={editing} onChange={handleChange} theme={theme} />
            <Field label="Serie de Boletas" name="serieBoleta" value={form.serieBoleta} editing={editing} onChange={handleChange} theme={theme} />
            <Field label="IGV (%)" name="igv" value={form.igv} editing={editing} onChange={handleChange} type="number" theme={theme} />
            <Field label="Moneda Principal" name="moneda" value={form.moneda} editing={editing} onChange={handleChange} theme={theme} />
            <Field label="Cuenta Bancaria" name="cuentaBancaria" value={form.cuentaBancaria} editing={editing} onChange={handleChange} theme={theme} />
            <div className="md:col-span-2">
              <Field label="Pie de Factura / Boleta" name="pieFactura" value={form.pieFactura} editing={editing} onChange={handleChange} theme={theme} textarea />
            </div>

            {/* QR Upload */}
            <div className="md:col-span-2">
              <label className={`text-xs uppercase tracking-wider font-semibold block mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <FaQrcode className="inline mr-1" /> QR Billetera Electrónica
              </label>
              <div className="flex items-center gap-6 flex-wrap">
                {/* Preview */}
                <div className={`w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden
                  ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                  {form.qrPath ? (
                    <img src={form.qrPath} alt="QR" className="w-full h-full object-contain" />
                  ) : (
                    <FaQrcode size={40} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} />
                  )}
                </div>

                {editing && (
                  <div className="flex flex-col gap-2">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Carga una imagen PNG del código QR de tu billetera electrónica.
                    </p>
                    <button
                      type="button"
                      onClick={() => qrInputRef.current?.click()}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors
                        ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
                    >
                      <FaUpload /> Subir PNG
                    </button>
                    <input
                      ref={qrInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                    {form.qrPath && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, qrPath: null }))}
                        className="text-xs text-red-400 hover:text-red-300 text-left"
                      >
                        Eliminar QR
                      </button>
                    )}
                  </div>
                )}

                {!editing && !form.qrPath && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    No se ha cargado ningún QR todavía.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-2 px-4 text-center text-xs text-gray-400 bg-black">
        ®Todos los derechos reservados. ERSOFT
      </div>

      {/* Modals */}
      {showConfirm && (
        <ConfirmModal
          onConfirm={handleConfirmed}
          onCancel={() => setShowConfirm(false)}
          theme={theme}
        />
      )}
      {showPassword && (
        <PasswordModal
          onConfirm={handlePasswordConfirmed}
          onCancel={() => setShowPassword(false)}
          theme={theme}
        />
      )}
    </div>
  );
};

export default Empresa;
