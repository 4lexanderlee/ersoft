import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  FaArrowLeft,
  FaUserCircle,
  FaEnvelope,
  FaPhone,
  FaIdBadge,
  FaCalendarAlt,
  FaBuilding,
  FaShieldAlt,
  FaMars,
} from 'react-icons/fa';

// The master user's "full" profile data (simulated)
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

const InfoRow = ({ label, value, bold, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <span className="text-gray-500 text-sm w-28 shrink-0">{label}</span>
    <span className={`text-base ${bold ? 'font-bold' : 'font-medium'}`}>{value}</span>
  </div>
);

const Perfil = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const profile = MASTER_PROFILE;

  const pageBg = theme === 'dark' ? 'bg-[#313b48]' : 'bg-[#d6d0d4]';
  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900';
  const headerBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-[#e8e3e8] border-gray-200';
  const labelColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const valueColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const avatarBg = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300';
  const badgeBg = theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-yellow-50 text-yellow-700 border border-yellow-200';
  const footerBg = 'bg-black';

  return (
    <div className={`flex flex-col min-h-full -m-6 ${pageBg}`}>
      {/* ── Header bar ── */}
      <div className={`flex items-center justify-between px-8 py-4 border-b ${headerBg}`}>
        <button
          onClick={() => navigate('/principal')}
          className={`flex items-center gap-2 font-bold text-lg transition-colors hover:opacity-70 ${valueColor}`}
        >
          <FaArrowLeft />
          Volver al menú
        </button>
        <div className="flex items-center gap-4">
          <span className={`font-medium ${valueColor}`}>{user?.role || 'Master'}</span>
          {/* Inline theme toggle look-alike */}
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm ${theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-400 text-gray-600'}`}>
            <span>🌙</span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col gap-4 px-10 py-6 max-w-3xl mx-auto w-full">

        {/* ── Card 1: Personal info ── */}
        <div className={`rounded-2xl border p-6 flex gap-6 items-start ${cardBg}`}>
          {/* Avatar */}
          <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center shrink-0 ${avatarBg}`}>
            <FaUserCircle size={64} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
          </div>

          {/* Info grid */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Nombres</span>
                <p className={`text-lg font-extrabold uppercase leading-tight ${valueColor}`}>{profile.name}</p>
              </div>
              <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${badgeBg}`}>
                <FaMars size={10} /> {profile.sexo}
              </span>
            </div>
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Apellidos</span>
              <p className={`text-base font-bold uppercase ${valueColor}`}>{profile.apellidos}</p>
            </div>
            <div className="flex items-center gap-2">
              <FaPhone size={13} className={labelColor} />
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Teléfono</span>
              <span className={`font-bold ml-1 ${valueColor}`}>{profile.telefono}</span>
            </div>
          </div>
        </div>

        {/* ── Card 2: Work info ── */}
        <div className={`rounded-2xl border p-6 ${cardBg}`}>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Cargo</span>
              <p className={`text-lg font-extrabold uppercase ${valueColor}`}>{profile.cargo}</p>
            </div>
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>ID</span>
              <p className={`text-lg font-extrabold ${valueColor}`}>{profile.id}</p>
            </div>
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Correo</span>
              <p className={`font-bold flex items-center gap-2 ${valueColor}`}>
                <FaEnvelope size={13} className={labelColor} />
                {profile.correo}
              </p>
            </div>
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Sucursal</span>
              <p className={`font-bold ${valueColor}`}>{profile.sucursal}</p>
            </div>
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Fecha de Inicio</span>
              <p className={`text-lg font-extrabold ${valueColor}`}>{profile.fechaInicio}</p>
            </div>
            <div>
              <span className={`text-xs uppercase tracking-wider ${labelColor}`}>Edad</span>
              <p className={`text-lg font-extrabold ${valueColor}`}>{profile.edad}</p>
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
      </div>

      {/* ── Footer ── */}
      <div className={`py-2 px-4 text-center text-xs text-gray-400 ${footerBg}`}>
        ®Todos los derechos reservados. ERSOFT
      </div>
    </div>
  );
};

export default Perfil;
