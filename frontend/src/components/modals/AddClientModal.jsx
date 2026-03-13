import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  validateDocNumber, validatePhone, validateEmail,
  validateName, sanitizeName, sanitizePhone, sanitizeDocNumber,
} from '../../utils/clientValidations';

/* ─────────────────────────────────────────────────────────────────
   Reusable Field wrapper
───────────────────────────────────────────────────────────────── */
const Field = ({ label, required, error, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-red-400 text-[11px] pl-1">{error}</p>}
  </div>
);

const PillInput = ({ inputCls, hasError, ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 border-2 rounded-full text-sm outline-none focus:ring-2
      ${hasError
        ? 'border-red-500 focus:ring-red-400'
        : 'focus:ring-yellow-500'
      } ${inputCls}`}
  />
);

/* ─────────────────────────────────────────────────────────────────
   Main Modal
───────────────────────────────────────────────────────────────── */
const AddClientModal = ({ isOpen, onClose, initialDocType = 'DNI', initialDocNumber = '', onClientAdded, isEditing = false, initialClientData = null }) => {
  const { theme } = useTheme();
  // In edit mode, determine if it's RUC from the existing data.
  const isRUC = isEditing ? initialClientData?.docType === 'RUC' : initialDocType === 'RUC';

  /* ── Person (DNI / CE) state ── */
  const [nombre,    setNombre]    = useState('');
  const [apellidos, setApellidos] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono,  setTelefono]  = useState('');
  const [correo,    setCorreo]    = useState('');

  /* ── Company (RUC) state ── */
  const [razonSocial,    setRazonSocial]    = useState('');
  const [ruc,            setRuc]            = useState('');
  const [correoRuc,      setCorreoRuc]      = useState('');
  const [telefonoRuc,    setTelefonoRuc]    = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');

  /* ── Errors ── */
  const [errors,    setErrors]    = useState({});

  // Pre-fill fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (isEditing && initialClientData) {
        if (initialClientData.docType === 'RUC') {
          setRuc(initialClientData.docNumber || '');
          setRazonSocial(initialClientData.name || '');
          setCorreoRuc(initialClientData.correo || '');
          setTelefonoRuc(initialClientData.telefono || '');
          setDireccionFiscal(initialClientData.direccionFiscal || '');
        } else {
          setDocumento(initialClientData.docNumber || '');
          setNombre(initialClientData.name || '');
          setApellidos(initialClientData.surname || '');
          setTelefono(initialClientData.telefono || '');
          setCorreo(initialClientData.correo || '');
        }
      } else {
        if (isRUC) {
          setRuc(initialDocNumber);
          setRazonSocial(''); setCorreoRuc(''); setTelefonoRuc(''); setDireccionFiscal('');
        } else {
          setDocumento(initialDocNumber);
          setNombre(''); setApellidos(''); setTelefono(''); setCorreo('');
        }
      }
    }
  }, [isOpen, initialDocType, initialDocNumber, isEditing, initialClientData, isRUC]);

  if (!isOpen) return null;

  /* ── Helpers ── */
  const setFieldError = (field, msg) =>
    setErrors(prev => ({ ...prev, [field]: msg }));
  const clearFieldError = (field) =>
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  const saveClient = (clientObj) => {
    const prev = JSON.parse(localStorage.getItem('ersoft_clients') || '[]');
    let updatedList;
    if (isEditing && initialClientData) {
      updatedList = prev.map(c => c.id === initialClientData.id ? { ...c, ...clientObj } : c);
    } else {
      updatedList = [clientObj, ...prev];
    }
    localStorage.setItem('ersoft_clients', JSON.stringify(updatedList));
    onClientAdded?.(clientObj);
    onClose();
  };

  /* ── DNI / CE submit ── */
  const handleSubmitPerson = (e) => {
    e.preventDefault();
    const errs = {};
    const eNombre    = validateName(nombre, 'Nombres');
    const eApellidos = validateName(apellidos, 'Apellidos');
    const eDoc       = validateDocNumber(initialDocType, documento);
    const eTel       = validatePhone(telefono);
    const eEmail     = validateEmail(correo);

    if (eNombre)    errs.nombre    = eNombre;
    if (eApellidos) errs.apellidos = eApellidos;
    if (eDoc)       errs.documento = eDoc;
    if (eTel)       errs.telefono  = eTel;
    if (eEmail)     errs.correo    = eEmail;

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    saveClient({
      id: isEditing ? initialClientData.id : Date.now(),
      docType: isEditing ? initialClientData.docType : initialDocType,
      docNumber: documento,
      name: nombre.trim(),
      surname: apellidos.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
    });
  };

  /* ── RUC submit ── */
  const handleSubmitRUC = (e) => {
    e.preventDefault();
    const errs = {};
    const eRazon = !razonSocial.trim() ? 'Razón Social es obligatoria.' : null;
    const eRuc   = validateDocNumber('RUC', ruc);
    const eTel   = validatePhone(telefonoRuc);
    const eEmail = validateEmail(correoRuc);

    if (eRazon) errs.razonSocial = eRazon;
    if (eRuc)   errs.ruc         = eRuc;
    if (eTel)   errs.telefonoRuc = eTel;
    if (eEmail) errs.correoRuc   = eEmail;

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    saveClient({
      id: isEditing ? initialClientData.id : Date.now(),
      docType: 'RUC',
      docNumber: ruc,
      name: razonSocial.trim(),
      surname: '',
      correo: correoRuc.trim(),
      telefono: telefonoRuc.trim(),
      direccionFiscal: direccionFiscal.trim(),
    });
  };

  /* ── Styles ── */
  const overlay  = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
  const modalBg  = theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200';
  const inputCls = theme === 'dark'
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const CloseBtn = () => (
    <button
      type="button"
      onClick={onClose}
      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-red-500 transition-colors z-10"
    >
      ✕
    </button>
  );

  /* ── Person modal (DNI / CE) ── */
  if (!isRUC) return (
    <div className={overlay}>
      <form onSubmit={handleSubmitPerson} noValidate
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-6 ${modalBg}`}>
        <CloseBtn />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombres" required error={errors.nombre}>
            <PillInput
              inputCls={inputCls}
              hasError={!!errors.nombre}
              placeholder="ej. Alexander Lee"
              value={nombre}
              onChange={e => {
                const v = sanitizeName(e.target.value);
                setNombre(v);
                if (errors.nombre) clearFieldError('nombre');
              }}
              onBlur={() => {
                const err = validateName(nombre, 'Nombres');
                if (err) setFieldError('nombre', err); else clearFieldError('nombre');
              }}
            />
          </Field>
          <Field label="Apellidos" required error={errors.apellidos}>
            <PillInput
              inputCls={inputCls}
              hasError={!!errors.apellidos}
              placeholder="ej. Melgarejo Romero"
              value={apellidos}
              onChange={e => {
                const v = sanitizeName(e.target.value);
                setApellidos(v);
                if (errors.apellidos) clearFieldError('apellidos');
              }}
              onBlur={() => {
                const err = validateName(apellidos, 'Apellidos');
                if (err) setFieldError('apellidos', err); else clearFieldError('apellidos');
              }}
            />
          </Field>
          <Field label="Documento" required error={errors.documento}>
            <PillInput
              inputCls={inputCls}
              hasError={!!errors.documento}
              placeholder={initialDocType === 'DNI' ? '8 dígitos' : '9 dígitos'}
              value={documento}
              onChange={e => {
                const v = sanitizeDocNumber(initialDocType, e.target.value);
                setDocumento(v);
                if (errors.documento) clearFieldError('documento');
              }}
              onBlur={() => {
                const err = validateDocNumber(initialDocType, documento);
                if (err) setFieldError('documento', err); else clearFieldError('documento');
              }}
            />
          </Field>
          <Field label="Teléfono" error={errors.telefono}>
            <PillInput
              inputCls={inputCls}
              hasError={!!errors.telefono}
              placeholder="XXX XXX XXX"
              value={telefono}
              onChange={e => {
                const v = sanitizePhone(e.target.value);
                setTelefono(v);
                if (errors.telefono) clearFieldError('telefono');
              }}
              onBlur={() => {
                const err = validatePhone(telefono);
                if (err) setFieldError('telefono', err); else clearFieldError('telefono');
              }}
            />
          </Field>
          <div className="col-span-2">
            <Field label="Correo" error={errors.correo}>
              <PillInput
                inputCls={inputCls}
                hasError={!!errors.correo}
                type="text"
                placeholder="ej. cliente_correo@ersoft.pe"
                value={correo}
                onChange={e => {
                  setCorreo(e.target.value);
                  if (errors.correo) clearFieldError('correo');
                }}
                onBlur={() => {
                  const err = validateEmail(correo);
                  if (err) setFieldError('correo', err); else clearFieldError('correo');
                }}
              />
            </Field>
          </div>
        </div>
        <button
          type="submit"
          className="mt-5 w-full py-3 bg-[#1a1a1a] hover:bg-gray-700 text-white font-bold rounded-full tracking-widest text-sm transition-colors"
        >
          AGREGAR CLIENTE
        </button>
      </form>
    </div>
  );

  /* ── Company modal (RUC) ── */
  return (
    <div className={overlay}>
      <form onSubmit={handleSubmitRUC} noValidate
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-6 ${modalBg}`}>
        <CloseBtn />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Razón Social" required error={errors.razonSocial}>
            <PillInput
              inputCls={inputCls}
              hasError={!!errors.razonSocial}
              placeholder="ej. R&E TALLERES SAC"
              value={razonSocial}
              onChange={e => {
                setRazonSocial(e.target.value.slice(0, 35));
                if (errors.razonSocial) clearFieldError('razonSocial');
              }}
              onBlur={() => {
                if (!razonSocial.trim()) setFieldError('razonSocial', 'Razón Social es obligatoria.');
                else clearFieldError('razonSocial');
              }}
            />
          </Field>
          <Field label="Correo" error={errors.correoRuc}>
            <PillInput
              inputCls={inputCls}
              hasError={!!errors.correoRuc}
              type="text"
              placeholder="ej. retalleres@re.pe"
              value={correoRuc}
              onChange={e => {
                setCorreoRuc(e.target.value);
                if (errors.correoRuc) clearFieldError('correoRuc');
              }}
              onBlur={() => {
                const err = validateEmail(correoRuc);
                if (err) setFieldError('correoRuc', err); else clearFieldError('correoRuc');
              }}
            />
          </Field>
          <Field label="RUC" required error={errors.ruc}>
            <PillInput
              inputCls={inputCls}
              hasError={!!errors.ruc}
              placeholder="11 dígitos"
              value={ruc}
              onChange={e => {
                const v = sanitizeDocNumber('RUC', e.target.value);
                setRuc(v);
                if (errors.ruc) clearFieldError('ruc');
              }}
              onBlur={() => {
                const err = validateDocNumber('RUC', ruc);
                if (err) setFieldError('ruc', err); else clearFieldError('ruc');
              }}
            />
          </Field>
          <Field label="Teléfono" error={errors.telefonoRuc}>
            <PillInput
              inputCls={inputCls}
              hasError={!!errors.telefonoRuc}
              placeholder="XXX XXX XXX"
              value={telefonoRuc}
              onChange={e => {
                const v = sanitizePhone(e.target.value);
                setTelefonoRuc(v);
                if (errors.telefonoRuc) clearFieldError('telefonoRuc');
              }}
              onBlur={() => {
                const err = validatePhone(telefonoRuc);
                if (err) setFieldError('telefonoRuc', err); else clearFieldError('telefonoRuc');
              }}
            />
          </Field>
          <div className="col-span-2">
            <Field label="Dirección Fiscal">
              <PillInput
                inputCls={inputCls}
                placeholder="ej. JR. BELLAVISTA 156 - LIMA - LIMA - SMP"
                value={direccionFiscal}
                onChange={e => setDireccionFiscal(e.target.value)}
              />
            </Field>
          </div>
        </div>
        <button
          type="submit"
          className="mt-5 w-full py-3 bg-[#1a1a1a] hover:bg-gray-700 text-white font-bold rounded-full tracking-widest text-sm transition-colors"
        >
          AGREGAR CLIENTE
        </button>
      </form>
    </div>
  );
};

export default AddClientModal;
