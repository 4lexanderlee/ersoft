import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEmpresa } from '../../context/EmpresaContext';
import { useDS } from '../../hooks/useDS';
import {
  FaPencilAlt, FaSave, FaTimes, FaBuilding, FaImage, FaUpload,
} from 'react-icons/fa';
import PageHeader from '../../components/ui/PageHeader';

/* ─────────────────────────────────────────────────────────
   VALIDATORS
   ───────────────────────────────────────────────────────── */
const DOC_LENGTHS = { DNI: 8, RUS: 11, RUC: 11 };

const validators = {
  razonSocial:       v => {
    if (!v || v.trim().length < 3) return 'La razón social debe tener al menos 3 caracteres.';
    if (v.trim().length > 60) return 'Máximo 60 caracteres.';
    return '';
  },
  nombreComercial:   v => {
    if (!v || v.trim().length < 2) return 'El nombre comercial debe tener al menos 2 caracteres.';
    if (v.trim().length > 60) return 'Máximo 60 caracteres.';
    return '';
  },
  tipoDocumento:     v => (!v) ? 'Selecciona el tipo de documento.' : '',
  ruc: (v, form) => {
    if (!v || !/^\d+$/.test(v)) return 'El número de documento solo acepta dígitos.';
    const expected = DOC_LENGTHS[form.tipoDocumento];
    if (expected && v.length !== expected) return `El ${form.tipoDocumento} debe tener ${expected} dígitos.`;
    return '';
  },
  distrito: v => {
    if (!v || v.trim() === '') return 'El distrito es obligatorio.';
    if (/\d/.test(v))          return 'El distrito no debe contener números.';
    if (v.trim().length > 30)  return 'Máximo 30 caracteres.';
    return '';
  },
  ciudad: v => {
    if (!v || v.trim() === '') return 'La ciudad es obligatoria.';
    if (/\d/.test(v))          return 'La ciudad no debe contener números.';
    if (v.trim().length > 30)  return 'Máximo 30 caracteres.';
    return '';
  },
  direccion:  v => {
    if (!v || v.trim().length < 5) return 'La dirección debe tener al menos 5 caracteres.';
    if (v.trim().length > 100) return 'Máximo 100 caracteres.';
    return '';
  },
  telefono:   v => {
    if (!v || v.trim() === '') return 'El teléfono es obligatorio.';
    if (!/^\d{9}$/.test(v.trim())) return 'El teléfono debe tener exactamente 9 dígitos numéricos.';
    return '';
  },
  codigoEstablecimiento: v => {
    if (!v || v.trim() === '') return 'El código de establecimiento es obligatorio.';
    if (!/^\d{4}$/.test(v.trim())) return 'El código de establecimiento debe tener exactamente 4 dígitos numéricos.';
    return '';
  },
  ubigeo: v => {
    if (!v || v.trim() === '') return 'El UBIGEO es obligatorio.';
    if (!/^\d{6}$/.test(v.trim())) return 'El UBIGEO debe tener exactamente 6 dígitos numéricos.';
    return '';
  },
  email: v => {
    if (!v || v.trim() === '') return 'El email es obligatorio.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ingresa un email válido.';
    if (v.trim().length > 50) return 'Máximo 50 caracteres.';
    return '';
  },
  encargado: v => {
    if (v && v.trim().length > 40) return 'Máximo 40 caracteres.';
    return '';
  },
};

const REQUIRED_FIELDS = [
  'razonSocial','nombreComercial','tipoDocumento','ruc',
  'distrito','ciudad','direccion',
  'telefono','codigoEstablecimiento','ubigeo','email',
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
  const encMsg = validators.encargado(form.encargado);
  if (encMsg) errs.encargado = encMsg;
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

  const docOption = DOC_OPTIONS.find(o => o.value === form.tipoDocumento);

  return (
    <div className="flex flex-col gap-2 md:col-span-2">
      <label className={`text-xs uppercase tracking-wider font-semibold ${labelCls}`}>
        Tipo de Documento / Número
        <span className="text-red-400 ml-1">*</span>
      </label>

      {editing ? (
        <>
          <div className="flex gap-2">
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

            <input
              type="text"
              name="ruc"
              value={form.ruc ?? ''}
              onChange={e => {
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
   MAIN COMPONENT
   ───────────────────────────────────────────────────────── */
const DatosUbi = () => {
  const ds = useDS();
  const { theme } = useTheme();
  const { empresa, updateEmpresa } = useEmpresa();
  const navigate = useNavigate();

  const [editing, setEditing]           = useState(false);
  const [form, setForm]                 = useState(empresa);
  const [errors, setErrors]             = useState({});
  const [showConfirm, setShowConfirm]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logoInputRef = useRef(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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

  const onlyDigitsKey = e => {
    if (!/[\d\s\-+()\backspace]/.test(e.key) && e.key.length === 1) e.preventDefault();
  };

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
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>
      <PageHeader
        backLabel="Volver al menú"
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

      <div className="flex-1 flex flex-col gap-5 px-10 py-6 max-w-4xl mx-auto w-full pb-10 overflow-y-auto">
        {/* CARD 1: Datos Generales */}
        <div className={`rounded-2xl border p-6 ${ds.cardBg}`}>
          <SectionTitle icon={FaBuilding} title="Datos Generales de la Empresa" theme={theme} />

          <div className="mb-6">
            <label className={`text-xs uppercase tracking-wider font-semibold block mb-2 ${ds.muted}`}>
              <FaImage className="inline mr-1" /> Logo de la Empresa (PNG)
            </label>
            <div className="flex items-start gap-6 flex-wrap">
              <div className={`w-36 h-36 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0
                ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                {form.logoPath ? (
                  <img src={form.logoPath} alt="Logo empresa" className="w-full h-full object-contain p-2" />
                ) : (
                  <FaImage size={38} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-300'} />
                )}
              </div>

              <div className="flex flex-col gap-2 justify-center">
                <p className={`text-sm ${ds.muted}`}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field {...fp('razonSocial', 'Razón Social', { maxLength: 60 })} />
            <Field {...fp('nombreComercial', 'Nombre Comercial', { maxLength: 60 })} />
            <DocField form={form} editing={editing} onChange={handleChange} errors={errors} theme={theme} />
          </div>
        </div>

        {/* CARD 2: Ubicación y Contacto */}
        <div className={`rounded-2xl border p-6 ${ds.cardBg}`}>
          <SectionTitle icon={FaBuilding} title="Ubicación y Contacto" theme={theme} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field {...fp('direccion', 'Dirección', { maxLength: 100 })} />
            <Field {...fp('distrito', 'Distrito', { maxLength: 30 })} onKeyDown={noDigitsKey} />
            <Field {...fp('ciudad', 'Ciudad / Provincia', { maxLength: 30 })} onKeyDown={noDigitsKey} />
            <Field {...fp('telefono', 'Teléfono (9 dígitos)', { maxLength: 9 })} onKeyDown={onlyDigitsKey} />
            <Field {...fp('codigoEstablecimiento', 'Código Establecimiento (SUNAT)', { maxLength: 4 })} onKeyDown={onlyDigitsKey} />
            <Field {...fp('ubigeo', 'UBIGEO', { maxLength: 6 })} onKeyDown={onlyDigitsKey} />
            <Field {...fp('email', 'Email', { maxLength: 50 })} type="email" />
            <Field {...fp('encargado', 'Encargado', { maxLength: 40 })} />
          </div>
        </div>
      </div>

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

export default DatosUbi;
