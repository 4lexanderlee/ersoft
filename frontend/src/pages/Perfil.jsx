import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDS } from '../hooks/useDS';
import PageHeader from '../components/ui/PageHeader';

import {
  FaUserCircle, FaEnvelope, FaPhone, FaShieldAlt,
  FaMars, FaVenus, FaPencilAlt, FaCheck, FaTimes,
  FaKey, FaUser, FaLock, FaEye, FaEyeSlash,
} from 'react-icons/fa';

// The master user's "full" profile data (default/fallback)
const MASTER_PROFILE = {
  name: 'Alexander Lee',
  apellidos: 'Melgarejo Romero',
  sexo: 'Masculino',
  telefono: '975 262 030',
  cargo: 'Master',
  id: 'MR000001',
  correo: 'melgarejorom@gmail.com',
  sucursal: '-',
  fechaInicio: '31/05/25',
  edad: 20,
  permisos: ['Acceso total'],
};

const STORAGE_KEY = 'ersoft_profile';

const loadProfile = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...MASTER_PROFILE, ...JSON.parse(saved) };
  } catch (_) {}
  return MASTER_PROFILE;
};

/* ─── Master-password confirmation modal ─── */
const MasterPasswordModal = ({ onConfirm, onCancel, theme, ds }) => {
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');

  const handleConfirm = () => {
    if (onConfirm(pwd)) {
      setErr('');
    } else {
      setErr('Contraseña incorrecta');
      setPwd('');
    }
  };

  const inputCls = ds.inputDarkFilled;
  const cardBg   = ds.cardBg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`rounded-2xl border p-7 w-full max-w-sm shadow-2xl flex flex-col gap-4 ${cardBg}`}>
        <div className="flex items-center gap-3">
          <FaLock className={ds.muted} size={18} />
          <h2 className={`text-base font-extrabold uppercase tracking-wider ${ds.text}`}>
            Confirmar identidad
          </h2>
        </div>
        <p className={`text-sm ${ds.muted}`}>
          Ingresa la contraseña master para editar los datos de acceso.
        </p>

        {/* Password input */}
        <div className="relative">
          <input
            autoFocus
            type={show ? 'text' : 'password'}
            placeholder="Contraseña master"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors pr-10 ${inputCls}`}
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${ds.muted} hover:text-white transition-colors`}
          >
            {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
          </button>
        </div>

        {err && <p className="text-red-400 text-xs font-semibold">{err}</p>}

        <div className="flex gap-3 justify-end mt-1">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400'
                : 'border-gray-300 text-gray-500 hover:text-gray-700'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Mask password: show first char + asterisks ─── */
const maskPassword = (pw = '') => {
  if (!pw) return '';
  return pw[0] + '*'.repeat(Math.max(pw.length - 1, 7));
};

const Perfil = () => {
  const { theme } = useTheme();
  const { user, verifyMasterPassword, updateCredentials, getCredentials } = useAuth();
  const navigate = useNavigate();
  const ds = useDS();

  const [profile, setProfile]   = useState(loadProfile);
  const [editing, setEditing]   = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [saveMsg, setSaveMsg]   = useState('');

  // Credentials state
  const [creds, setCreds]             = useState(getCredentials);
  const [showModal, setShowModal]     = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPwd, setShowNewPwd]   = useState(false);

  // Re-read creds whenever editing ends (in case they changed)
  useEffect(() => {
    if (!editing) setCreds(getCredentials());
  }, [editing]);

  // Derived token aliases
  const avatarBg   = ds.isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300';
  const inputCls   = ds.inputDarkFilled;
  const cardBg     = ds.cardBg;
  const labelColor = ds.muted;
  const valueColor = ds.text;
  const badgeBg    = ds.isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700';

  // ── Edit pencil clicked → open master-password modal ──
  const startEdit = () => {
    setShowModal(true);
  };

  const handleModalConfirm = (pwd) => {
    if (verifyMasterPassword(pwd)) {
      setShowModal(false);
      setFormData({ ...profile });
      setNewUsername(creds.username);
      setNewPassword(creds.password);
      setSaveMsg('');
      setEditing(true);
      return true;
    }
    return false;
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveMsg('');
  };

  const saveEdit = () => {
    // Save profile fields
    const updated = { ...profile, ...formData };
    setProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (_) {}

    // Save credentials if they changed
    const trimUser = newUsername.trim();
    const trimPwd  = newPassword.trim();
    if (trimUser && trimPwd) {
      updateCredentials(trimUser, trimPwd);
      setCreds({ username: trimUser, password: trimPwd });
    }

    setEditing(false);
    setSaveMsg('✓ Guardado correctamente');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const field = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className={`flex flex-col h-full -m-6 ${ds.pageBg}`}>
      {/* Master-password modal */}
      {showModal && (
        <MasterPasswordModal
          onConfirm={handleModalConfirm}
          onCancel={() => setShowModal(false)}
          theme={theme}
          ds={ds}
        />
      )}

      {/* ── Header bar ── */}
      <PageHeader onBack={() => navigate('/principal')} />

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col gap-4 px-10 py-6 max-w-3xl mx-auto w-full">

        {/* Save message */}
        {saveMsg && (
          <div className="text-green-400 text-sm font-semibold text-center">{saveMsg}</div>
        )}

        {/* ── Card 1: Personal info ── */}
        <div className={`rounded-2xl border p-6 flex gap-6 items-start ${cardBg}`}>
          {/* Avatar */}
          <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center shrink-0 ${avatarBg}`}>
            <FaUserCircle size={64} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
          </div>

          {/* Info grid */}
          <div className="flex flex-col gap-3 flex-1">
            {/* Nombres row + badge + edit button */}
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1">
                <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Nombres</span>
                {editing
                  ? <input
                      type="text"
                      value={formData.name}
                      onChange={e => field('name', e.target.value)}
                      placeholder="Nombre(s)"
                      className={`px-3 py-1.5 rounded-lg border text-sm outline-none transition-colors w-full ${inputCls}`}
                    />
                  : <p className={`text-lg font-extrabold uppercase leading-tight ${valueColor}`}>{profile.name}</p>
                }
              </div>
              {/* Gender badge / editable toggle */}
              {editing ? (
                <button
                  type="button"
                  onClick={() => field('sexo', formData.sexo === 'Masculino' ? 'Femenino' : 'Masculino')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border-2 border-dashed transition-colors cursor-pointer select-none
                    ${formData.sexo === 'Femenino'
                      ? 'border-pink-400 text-pink-500 bg-pink-50'
                      : 'border-blue-400 text-blue-600 bg-blue-50'}`}
                  title="Clic para cambiar género"
                >
                  {formData.sexo === 'Femenino' ? <FaVenus size={10} /> : <FaMars size={10} />}
                  {formData.sexo}
                </button>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${badgeBg}`}>
                  {profile.sexo === 'Femenino' ? <FaVenus size={10} /> : <FaMars size={10} />}
                  {profile.sexo}
                </span>
              )}
              {/* Edit / Save / Cancel buttons */}
              {!editing ? (
                <button
                  onClick={startEdit}
                  title="Editar perfil"
                  className={`p-2 rounded-full border transition-colors hover:scale-105 ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:text-yellow-400 hover:border-yellow-400' : 'border-gray-300 text-gray-400 hover:text-yellow-600 hover:border-yellow-500'}`}
                >
                  <FaPencilAlt size={13} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    title="Guardar"
                    className="p-2 rounded-full border border-green-500 text-green-400 hover:bg-green-500/10 transition-colors"
                  >
                    <FaCheck size={13} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    title="Cancelar"
                    className="p-2 rounded-full border border-red-500 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <FaTimes size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Apellidos */}
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Apellidos</span>
              {editing
                ? <input
                    type="text"
                    value={formData.apellidos}
                    onChange={e => field('apellidos', e.target.value)}
                    placeholder="Apellido(s)"
                    className={`px-3 py-1.5 rounded-lg border text-sm outline-none transition-colors w-full ${inputCls}`}
                  />
                : <p className={`text-base font-bold uppercase ${valueColor}`}>{profile.apellidos}</p>
              }
            </div>

            {/* Teléfono */}
            <div className="flex items-center gap-2">
              <FaPhone size={13} className={labelColor} />
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Teléfono</span>
              {editing
                ? <input
                    type="text"
                    value={formData.telefono}
                    onChange={e => field('telefono', e.target.value)}
                    placeholder="XXX XXX XXX"
                    className={`px-3 py-1.5 rounded-lg border text-sm outline-none transition-colors flex-1 ${inputCls}`}
                  />
                : <span className={`font-bold ml-1 ${valueColor}`}>{profile.telefono}</span>
              }
            </div>
          </div>
        </div>

        {/* ── Card 2: Work info ── */}
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            {/* Cargo – read only */}
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Cargo</span>
              <p className={`text-lg font-extrabold uppercase ${valueColor}`}>{profile.cargo}</p>
            </div>
            {/* ID – read only */}
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>ID</span>
              <p className={`text-lg font-extrabold ${valueColor}`}>{profile.id}</p>
            </div>
            {/* Correo – editable */}
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Correo</span>
              {editing
                ? <input
                    type="email"
                    value={formData.correo}
                    onChange={e => field('correo', e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className={`px-3 py-1.5 rounded-lg border text-sm outline-none transition-colors w-full mt-1 ${inputCls}`}
                  />
                : (
                  <p className={`font-bold flex items-center gap-2 ${valueColor}`}>
                    <FaEnvelope size={13} className={labelColor} />
                    {profile.correo}
                  </p>
                )
              }
            </div>
            {/* Sucursal – read only */}
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Sucursal</span>
              <p className={`font-bold ${valueColor}`}>{profile.sucursal}</p>
            </div>
            {/* Fecha inicio – read only */}
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Fecha de Inicio</span>
              <p className={`text-lg font-extrabold ${valueColor}`}>{profile.fechaInicio}</p>
            </div>
            {/* Edad – editable */}
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Edad</span>
              {editing
                ? <input
                    type="number"
                    value={formData.edad}
                    onChange={e => field('edad', e.target.value)}
                    placeholder="Edad"
                    className={`px-3 py-1.5 rounded-lg border text-sm outline-none transition-colors w-24 mt-1 ${inputCls}`}
                  />
                : <p className={`text-lg font-extrabold ${valueColor}`}>{profile.edad}</p>
              }
            </div>
          </div>
        </div>

        {/* ── Card 3: Permissions ── */}
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
          <div className="flex items-center gap-2 mb-3">
            <FaShieldAlt className={labelColor} />
            <span className={`text-sm font-bold uppercase tracking-widest ${labelColor}`}>Permisos</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {profile.permisos.map((p) => (
              <li key={p} className={`font-medium ${valueColor}`}>{p}</li>
            ))}
          </ul>
        </div>

        {/* ── Card 4: Access credentials ── */}
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
          <div className="flex items-center gap-2 mb-4">
            <FaKey className={labelColor} />
            <span className={`text-sm font-bold uppercase tracking-widest ${labelColor}`}>Datos de acceso</span>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            {/* Usuario */}
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Usuario</span>
              {editing ? (
                <div className="flex items-center gap-2 mt-1">
                  <FaUser size={13} className={labelColor} />
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="Nombre de usuario"
                    className={`px-3 py-1.5 rounded-lg border text-sm outline-none transition-colors flex-1 ${inputCls}`}
                  />
                </div>
              ) : (
                <p className={`font-bold flex items-center gap-2 mt-0.5 ${valueColor}`}>
                  <FaUser size={13} className={labelColor} />
                  {creds.username}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Contraseña</span>
              {editing ? (
                <div className="relative mt-1">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Nueva contraseña"
                    className={`px-3 py-1.5 rounded-lg border text-sm outline-none transition-colors w-full pr-8 ${inputCls}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(s => !s)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${labelColor} hover:text-white transition-colors`}
                  >
                    {showNewPwd ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              ) : (
                <p className={`font-bold font-mono flex items-center gap-2 mt-0.5 ${valueColor}`}>
                  <FaLock size={13} className={labelColor} />
                  {maskPassword(creds.password)}
                </p>
              )}
            </div>
          </div>

          {/* Hint */}
          {!editing && (
            <p className={`text-xs mt-4 ${labelColor}`}>
              Usa el lápiz de editar para cambiar el usuario o la contraseña.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Perfil;
