import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useEmpresa } from '../context/EmpresaContext';
import {
  FaPencilAlt, FaSave, FaTimes, FaBuilding, FaFileInvoiceDollar,
  FaQrcode, FaUpload, FaImage,
} from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';

/* ─────────────────────────────────────────────────────────
   VALIDATORS
───────────────────────────────────────────────────────── */
const DOC_LENGTHS = { DNI: 8, RUS: 11, RUC: 11 };

const validators = {
  razonSocial:       v => (!v || v.trim().length < 3)   ? 'La razón social debe tener al menos 3 caracteres.' : '',
  nombreComercial:   v => (!v || v.trim().length < 2)   ? 'El nombre comercial debe tener al menos 2 caracteres.' : '',
  tipoDocumento:     v => (!v)                           ? 'Selecciona el tipo de documento.' : '',
  ruc: (v, form) => {
    if (!v || !/^\d+$/.test(v)) return 'El número de documento solo acepta dígitos.';
    const expected = DOC_LENGTHS[form.tipoDocumento];
    if (expected && v.length !== expected) return `El ${form.tipoDocumento} debe tener ${expected} dígitos.`;
    return '';
  },
  giroNegocio:       v => (!v || v.trim().length < 5)   ? 'El giro de negocio debe tener al menos 5 caracteres.' : '',
  representanteLegal:v => {
    if (!v || v.trim() === '') return 'El representante legal es obligatorio.';
    if (/\d/.test(v))          return 'El representante legal no debe contener números.';
    return '';
  },
  departamento: v => {
    if (!v || v.trim() === '') return 'El departamento es obligatorio.';
    if (/\d/.test(v))          return 'El departamento no debe contener números.';
    return '';
  },
  provincia: v => {
    if (!v || v.trim() === '') return 'La provincia es obligatoria.';
    if (/\d/.test(v))          return 'La provincia no debe contener números.';
    return '';
  },
  distrito: v => {
    if (!v || v.trim() === '') return 'El distrito es obligatorio.';
    if (/\d/.test(v))          return 'El distrito no debe contener números.';
    return '';
  },
  direccion:  v => (!v || v.trim().length < 5)   ? 'La dirección debe tener al menos 5 caracteres.' : '',
  telefono:   v => {
    if (!v || v.trim() === '') return 'El teléfono es obligatorio.';
    if (!/^[\d\s\-+()]+$/.test(v)) return 'El teléfono solo acepta dígitos, espacios y guiones.';
    const digits = v.replace(/\D/g, '');
    if (digits.length < 6) return 'El teléfono debe tener al menos 6 dígitos.';
    return '';
  },
  celular:    v => {
    if (!v || v.trim() === '') return 'El celular es obligatorio.';
    if (!/^[\d\s\-+()]+$/.test(v)) return 'El celular solo acepta dígitos, espacios y guiones.';
    const digits = v.replace(/\D/g, '');
    if (digits.length < 9) return 'El celular debe tener al menos 9 dígitos.';
    return '';
  },
  email: v => {
    if (!v || v.trim() === '') return 'El email es obligatorio.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ingresa un email válido.';
    return '';
  },
};

const REQUIRED_FIELDS = [
  'razonSocial','nombreComercial','tipoDocumento','ruc',
  'giroNegocio','representanteLegal',
  'departamento','provincia','distrito','direccion',
  'telefono','celular','email',
];

function validateAll(form) {
  const errs = {};
  REQUIRED_FIELDS.forEach(key => {
    const fn = validators[key];
    if (fn) {
      const msg = fn(form[key], form);
      if (msg) errs[key] = msg;
    }
  });
  return errs;
}

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────── */
const SectionTitle = ({ icon: Icon, title, theme }) => (
  <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${theme === 'dark' ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}>
    <Icon className="text-yellow-500" />
    <h2 className="font-bold text-base uppercase tracking-wider">{title}</h2>
  </div>
);

/** Generic text/number/email field with optional required marker and error display */
const Field = ({
  label, name, value, editing, onChange, type = 'text',
  textarea, theme, required, error,
  onKeyDown,
}) => {
  const labelCls  = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const valueCls  = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const inputBase = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors`;
  const inputOk   = theme === 'dark'
    ? 'bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500';
  const inputErr  = 'border-red-500 focus:border-red-500 focus:ring-red-500';

  return (
    <div className="flex flex-col gap-1">
      <label className={`text-xs uppercase tracking-wider font-semibold ${labelCls}`}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {editing ? (
        textarea ? (
          <textarea
            name={name}
            value={value ?? ''}
            onChange={onChange}
            rows={2}
            className={`${inputBase} resize-none ${error ? inputErr : inputOk}`}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            onKeyDown={onKeyDown}
            className={`${inputBase} ${error ? inputErr : inputOk}`}
          />
        )
      ) : (
        <p className={`text-sm font-medium ${valueCls}`}>{value || '—'}</p>
      )}
      {editing && error && (
        <p className="text-xs text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
};

/** Document type selector + number input side-by-side */
const DocField = ({ form, editing, onChange, errors, theme }) => {
  const labelCls  = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const valueCls  = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const inputBase = `px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors`;
  const inputOk   = theme === 'dark'
    ? 'bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500';
  const inputErr  = 'border-red-500 focus:border-red-500 focus:ring-red-500';

  const DOC_OPTIONS = [
    { value: 'DNI', label: 'DNI – Persona Natural' },
    { value: 'RUS', label: 'RUS – Régimen Único Simplificado' },
    { value: 'RUC', label: 'RUC – Registro Único de Contribuyentes' },
  ];

  // display label for view mode
  const docOption = DOC_OPTIONS.find(o => o.value === form.tipoDocumento);
  const docLabel  = docOption ? `[${docOption.value}] ${form.ruc || '—'}` : (form.ruc || '—');

  return (
    <div className="flex flex-col gap-2 md:col-span-2">
      <label className={`text-xs uppercase tracking-wider font-semibold ${labelCls}`}>
        Tipo de Documento / Número
        <span className="text-red-400 ml-1">*</span>
      </label>

      {editing ? (
        <>
          <div className="flex gap-2">
            {/* Type select */}
            <select
              name="tipoDocumento"
              value={form.tipoDocumento ?? ''}
              onChange={onChange}
              className={`shrink-0 w-64 ${inputBase} ${errors.tipoDocumento ? inputErr : inputOk}`}
            >
              <option value="">Seleccionar tipo…</option>
              {DOC_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Number input – digits only */}
            <input
              type="text"
              name="ruc"
              value={form.ruc ?? ''}
              onChange={e => {
                // strip non-digits
                const clean = e.target.value.replace(/\D/g, '');
                onChange({ target: { name: 'ruc', value: clean } });
              }}
              placeholder={
                form.tipoDocumento === 'DNI' ? '8 dígitos'
                  : form.tipoDocumento === 'RUS' ? '11 dígitos'
                  : form.tipoDocumento === 'RUC' ? '11 dígitos'
                  : 'Número de documento'
              }
              maxLength={form.tipoDocumento === 'DNI' ? 8 : 11}
              className={`flex-1 ${inputBase} ${errors.ruc ? inputErr : inputOk}`}
            />
          </div>

          {/* Error messages */}
          {errors.tipoDocumento && <p className="text-xs text-red-400">{errors.tipoDocumento}</p>}
          {errors.ruc           && <p className="text-xs text-red-400">{errors.ruc}</p>}
        </>
      ) : (
        <p className={`text-sm font-medium ${valueCls}`}>
          {docOption ? <span className="font-bold text-yellow-500 mr-1">[{docOption.value}]</span> : null}
          {form.ruc || '—'}
        </p>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MODALS
───────────────────────────────────────────────────────── */
const ConfirmModal = ({ onConfirm, onCancel, theme }) => {
  const cardCls = theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
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
          <button onClick={onCancel}
            className={`flex-1 py-2 rounded-xl border font-semibold transition-colors
              ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-colors">
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordModal = ({ onConfirm, onCancel, theme }) => {
  const [pwd, setPwd]     = useState('');
  const [error, setError] = useState('');
  const { login, user }   = useAuth();
  const cardCls  = theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const inputCls = theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  const handleSubmit = e => {
    e.preventDefault();
    const result = login(user.username, pwd);
    if (result.success) { onConfirm(); }
    else { setError('Contraseña incorrecta. Inténtalo nuevamente.'); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col gap-5 ${cardCls}`}>
        <h3 className="text-lg font-bold text-center">Confirmar identidad</h3>
        <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Ingresa tu contraseña para aplicar los cambios.
        </p>
        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-xl">{error}</p>}
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
            <button type="button" onClick={onCancel}
              className={`flex-1 py-2 rounded-xl border font-semibold transition-colors
                ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
const Empresa = () => {
  const { theme }                = useTheme();
  const { user }                 = useAuth();
  const { empresa, updateEmpresa } = useEmpresa();
  const navigate                 = useNavigate();

  const [editing, setEditing]           = useState(false);
  const [form, setForm]                 = useState(empresa);
  const [errors, setErrors]             = useState({});
  const [showConfirm, setShowConfirm]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logoInputRef = useRef(null);
  const qrInputRef   = useRef(null);

  /* ── style vars ── */
  const pageBg    = theme === 'dark' ? 'bg-[#313b48]' : 'bg-[#d6d0d4]';
  const cardBg    = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const labelCls  = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const valueCls  = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';

  /* ── handlers ── */
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // re-validate touched field
    const fn = validators[name];
    if (fn) {
      const updated = { ...form, [name]: value };
      const msg = fn(value, updated);
      setErrors(prev => ({ ...prev, [name]: msg }));
    }
  };

  const handleLogoUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, logoPath: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleQrUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, qrPath: reader.result }));
    reader.readAsDataURL(file);
  };

  /** Block letters in phone fields */
  const onlyDigitsKey = e => {
    if (!/[\d\s\-+()\backspace]/.test(e.key) && e.key.length === 1) e.preventDefault();
  };

  /** Block digits in text-only fields */
  const noDigitsKey = e => {
    if (/\d/.test(e.key)) e.preventDefault();
  };

  const handleSaveClick = () => {
    const errs = validateAll(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setShowConfirm(true);
    }
  };

  const handleConfirmed = () => {
    setShowConfirm(false);
    setShowPassword(true);
  };

  const handlePasswordConfirmed = () => {
    updateEmpresa(form);
    setShowPassword(false);
    setEditing(false);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setForm(empresa);
    setEditing(false);
    setErrors({});
  };

  /* ── shared field props helper ── */
  const fp = (name, label, extra = {}) => ({
    label,
    name,
    value: form[name],
    editing,
    onChange: handleChange,
    theme,
    required: REQUIRED_FIELDS.includes(name),
    error: errors[name],
    ...extra,
  });

  return (
    <div className={`flex flex-col h-full -m-6 ${pageBg}`}>

      <PageHeader
        onBack={() => navigate('/principal')}
        right={
          editing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-colors
                  ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
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
          )
        }
      />

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col gap-5 px-10 py-6 max-w-4xl mx-auto w-full pb-10">

        {/* ════ CARD 1: Datos Generales ════ */}
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
          <SectionTitle icon={FaBuilding} title="Datos Generales de la Empresa" theme={theme} />

          {/* ── Logo Upload ── */}
          <div className="mb-6">
            <label className={`text-xs uppercase tracking-wider font-semibold block mb-2 ${labelCls}`}>
              <FaImage className="inline mr-1" /> Logo de la Empresa (PNG)
            </label>
            <div className="flex items-start gap-6 flex-wrap">
              {/* Preview */}
              <div className={`w-36 h-36 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0
                ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                {form.logoPath ? (
                  <img src={form.logoPath} alt="Logo empresa" className="w-full h-full object-contain p-2" />
                ) : (
                  <FaImage size={38} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} />
                )}
              </div>

              <div className="flex flex-col gap-2 justify-center">
                <p className={`text-sm ${labelCls}`}>
                  El logo aparecerá en la parte superior del ticket, boleta o factura.
                </p>
                {editing && (
                  <>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors
                        ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
                    >
                      <FaUpload /> Subir Logo PNG
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/png"
                      onChange={handleLogoUpload} className="hidden" />
                    {form.logoPath && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, logoPath: null }))}
                        className="text-xs text-red-400 hover:text-red-300 text-left"
                      >
                        Eliminar logo
                      </button>
                    )}
                  </>
                )}
                {!editing && !form.logoPath && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    No se ha cargado ningún logo todavía.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Datos Generales fields ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field {...fp('razonSocial', 'Razón Social')} />
            <Field {...fp('nombreComercial', 'Nombre Comercial')} />

            {/* Doc type + number (spans 2 cols) */}
            <DocField
              form={form}
              editing={editing}
              onChange={handleChange}
              errors={errors}
              theme={theme}
            />

            <div className="md:col-span-2">
              <Field {...fp('giroNegocio', 'Giro de Negocio')} textarea />
            </div>
            <Field {...fp('representanteLegal', 'Representante Legal')} onKeyDown={noDigitsKey} />
          </div>
        </div>

        {/* ════ CARD 2: Ubicación y Contacto ════ */}
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
          <SectionTitle icon={FaBuilding} title="Ubicación y Contacto" theme={theme} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field {...fp('departamento', 'Departamento')} onKeyDown={noDigitsKey} />
            <Field {...fp('provincia', 'Provincia')} onKeyDown={noDigitsKey} />
            <Field {...fp('distrito', 'Distrito')} onKeyDown={noDigitsKey} />
            <div className="md:col-span-3">
              <Field {...fp('direccion', 'Dirección')} />
            </div>
            <Field {...fp('telefono', 'Teléfono Fijo')} onKeyDown={onlyDigitsKey} />
            <Field {...fp('celular', 'Celular')} onKeyDown={onlyDigitsKey} />
            <Field {...fp('email', 'Email')} type="email" />
            {/* Sitio Web – optional, no required marker */}
            <Field
              label="Sitio Web"
              name="web"
              value={form.web}
              editing={editing}
              onChange={handleChange}
              theme={theme}
              required={false}
              error={undefined}
            />
          </div>
        </div>

        {/* ════ CARD 3: Datos de Facturación ════ */}
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
          <SectionTitle icon={FaFileInvoiceDollar} title="Datos de Facturación" theme={theme} />
          {editing && (
            <p className={`text-xs mb-4 ${labelCls}`}>
              Los campos de esta sección son opcionales.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Serie de Facturas"   name="serieFactura"  value={form.serieFactura}  editing={editing} onChange={handleChange} theme={theme} />
            <Field label="Serie de Boletas"    name="serieBoleta"   value={form.serieBoleta}   editing={editing} onChange={handleChange} theme={theme} />
            <Field label="IGV (%)"             name="igv"           value={form.igv}           editing={editing} onChange={handleChange} type="number" theme={theme} />
            <Field label="Moneda Principal"    name="moneda"        value={form.moneda}        editing={editing} onChange={handleChange} theme={theme} />
            <Field label="Cuenta Bancaria"     name="cuentaBancaria" value={form.cuentaBancaria} editing={editing} onChange={handleChange} theme={theme} />
            <div className="md:col-span-2">
              <Field label="Pie de Factura / Boleta" name="pieFactura" value={form.pieFactura} editing={editing} onChange={handleChange} theme={theme} textarea />
            </div>

            {/* ── QR Upload ── */}
            <div className="md:col-span-2">
              <label className={`text-xs uppercase tracking-wider font-semibold block mb-2 ${labelCls}`}>
                <FaQrcode className="inline mr-1" /> QR Billetera Electrónica
              </label>
              <div className="flex items-center gap-6 flex-wrap">
                <div className={`w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden
                  ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                  {form.qrPath
                    ? <img src={form.qrPath} alt="QR" className="w-full h-full object-contain" />
                    : <FaQrcode size={40} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} />
                  }
                </div>

                {editing && (
                  <div className="flex flex-col gap-2">
                    <p className={`text-sm ${labelCls}`}>
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
                    <input ref={qrInputRef} type="file" accept="image/png,image/jpeg"
                      onChange={handleQrUpload} className="hidden" />
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

      {/* ── Modals ── */}
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
