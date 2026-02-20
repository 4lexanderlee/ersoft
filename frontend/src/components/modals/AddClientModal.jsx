import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

/* ─────────────────────────────────────────────────────────────────
   Reusable styled input matching the design (rounded pill border)
───────────────────────────────────────────────────────────────── */
const Field = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const PillInput = ({ inputCls, ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 border-2 rounded-full text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${inputCls}`}
  />
);

/* ─────────────────────────────────────────────────────────────────
   Main Modal
───────────────────────────────────────────────────────────────── */
const AddClientModal = ({ isOpen, onClose, initialDocType = 'DNI', initialDocNumber = '', onClientAdded }) => {
  const { theme } = useTheme();
  const isRUC = initialDocType === 'RUC';

  /* ── Person (DNI / CE) form ── */
  const [nombre,   setNombre]   = useState('');
  const [apellidos, setApellidos] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo,   setCorreo]   = useState('');

  /* ── Company (RUC) form ── */
  const [razonSocial,    setRazonSocial]    = useState('');
  const [ruc,            setRuc]            = useState('');
  const [correoRuc,      setCorreoRuc]      = useState('');
  const [telefonoRuc,    setTelefonoRuc]    = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');

  const [error, setError] = useState('');

  // Pre-fill document number from search bar when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (isRUC) {
        setRuc(initialDocNumber);
        setRazonSocial(''); setCorreoRuc(''); setTelefonoRuc(''); setDireccionFiscal('');
      } else {
        setDocumento(initialDocNumber);
        setNombre(''); setApellidos(''); setTelefono(''); setCorreo('');
      }
    }
  }, [isOpen, initialDocType, initialDocNumber]);

  if (!isOpen) return null;

  const saveClient = (newClient) => {
    const prev = JSON.parse(localStorage.getItem('ersoft_clients') || '[]');
    localStorage.setItem('ersoft_clients', JSON.stringify([newClient, ...prev]));
    onClientAdded?.(newClient);
    onClose();
  };

  const handleSubmitPerson = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !apellidos.trim()) { setError('Nombres y Apellidos son obligatorios.'); return; }
    saveClient({
      id: Date.now(),
      docType: initialDocType,
      docNumber: documento,
      name: nombre.trim(),
      surname: apellidos.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
    });
  };

  const handleSubmitRUC = (e) => {
    e.preventDefault();
    if (!razonSocial.trim() || !ruc.trim()) { setError('Razón Social y RUC son obligatorios.'); return; }
    saveClient({
      id: Date.now(),
      docType: 'RUC',
      docNumber: ruc,
      name: razonSocial.trim(),
      surname: '',
      correo: correoRuc.trim(),
      telefono: telefonoRuc.trim(),
      direccionFiscal: direccionFiscal.trim(),
    });
  };

  /* Styles */
  const overlay  = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
  const modalBg  = theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200';
  const inputCls = theme === 'dark'
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const text     = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subTx    = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  /* ── Shared X button ── */
  const CloseBtn = () => (
    <button
      onClick={onClose}
      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-red-500 transition-colors z-10"
    >
      ✕
    </button>
  );

  /* ── Person modal (DNI / CE) ── */
  if (!isRUC) return (
    <div className={overlay}>
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-6 ${modalBg}`}>
        <CloseBtn />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombres" required>
            <PillInput inputCls={inputCls} placeholder="Alexander Lee" value={nombre} onChange={e => setNombre(e.target.value)} />
          </Field>
          <Field label="Apellidos" required>
            <PillInput inputCls={inputCls} placeholder="Melgarejo Romero" value={apellidos} onChange={e => setApellidos(e.target.value)} />
          </Field>
          <Field label="Documento">
            <PillInput inputCls={inputCls} placeholder="75282415" value={documento} onChange={e => setDocumento(e.target.value.replace(/\D/g, '').slice(0, 9))} />
          </Field>
          <Field label="Teléfono">
            <PillInput inputCls={inputCls} placeholder="xxx xxx xxx" value={telefono} onChange={e => setTelefono(e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Field label="Correo">
              <PillInput inputCls={inputCls} type="email" placeholder="cliente_correo@ersoft.pe" value={correo} onChange={e => setCorreo(e.target.value)} />
            </Field>
          </div>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        <button
          onClick={handleSubmitPerson}
          className="mt-4 w-full py-3 bg-[#1a1a1a] hover:bg-gray-700 text-white font-bold rounded-full tracking-widest text-sm"
        >
          AGREGAR CLIENTE
        </button>
      </div>
    </div>
  );

  /* ── Company modal (RUC) ── */
  return (
    <div className={overlay}>
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-6 ${modalBg}`}>
        <CloseBtn />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Razón Social" required>
            <PillInput inputCls={inputCls} placeholder="R&E TALLERES SAC" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} />
          </Field>
          <Field label="Correo">
            <PillInput inputCls={inputCls} type="email" placeholder="retalleres@re.pe" value={correoRuc} onChange={e => setCorreoRuc(e.target.value)} />
          </Field>
          <Field label="RUC" required>
            <PillInput inputCls={inputCls} placeholder="20603125258" value={ruc} onChange={e => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))} />
          </Field>
          <Field label="Teléfono">
            <PillInput inputCls={inputCls} placeholder="985 425 456" value={telefonoRuc} onChange={e => setTelefonoRuc(e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Field label="Dirección fiscal">
              <PillInput inputCls={inputCls} placeholder="JR. BELLAVISTA 156 - LIMA - LIMA - SMP" value={direccionFiscal} onChange={e => setDireccionFiscal(e.target.value)} />
            </Field>
          </div>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        <button
          onClick={handleSubmitRUC}
          className="mt-4 w-full py-3 bg-[#1a1a1a] hover:bg-gray-700 text-white font-bold rounded-full tracking-widest text-sm"
        >
          AGREGAR CLIENTE
        </button>
      </div>
    </div>
  );
};

export default AddClientModal;
