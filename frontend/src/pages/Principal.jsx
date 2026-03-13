import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDS } from '../hooks/useDS';
import ClientSearch from '../components/dashboard/ClientSearch';
import ClientInfo from '../components/dashboard/ClientInfo';
import AddClientModal from '../components/modals/AddClientModal';
import { simulatedClients } from '../data/simulatedClients';
import Btn from '../components/ui/Btn';
import Card from '../components/ui/Card';
import {
  FaShoppingCart, FaFileInvoiceDollar, FaTools, FaUsers, FaChartBar, FaCalendarAlt,
  FaLock, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { MdInventory } from 'react-icons/md';

/* ─── Master-password confirmation modal ─── */
const MasterPasswordModal = ({ onConfirm, onCancel, ds }) => {
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
            Autorizar Edición
          </h2>
        </div>
        <p className={`text-sm ${ds.muted}`}>
          Ingresa la contraseña master para editar los datos de este cliente.
        </p>

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
            className="px-4 py-2 rounded-lg text-sm font-bold border transition-colors border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400"
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

// ── Module card (big icon tile) ─────────────────────────────────
const ModuleCard = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex-1 min-w-[110px] h-32 rounded-2xl flex flex-col items-center justify-center
      text-white font-bold gap-2 shadow-lg transition-all hover:scale-105 active:scale-95
      bg-[#1a1a1a] hover:bg-gray-800
      border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
  >
    <span className="opacity-90">{icon}</span>
    <span className="text-xs font-bold tracking-widest opacity-80">{label}</span>
  </button>
);

const Principal = () => {
  const ds = useDS();
  const navigate = useNavigate();
  const { verifyMasterPassword } = useAuth();
  const [currentClient, setCurrentClient] = useState(null);
  
  // Client creation / editing modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDocType, setModalInitialDocType] = useState('DNI');
  const [modalInitialDocNumber, setModalInitialDocNumber] = useState('');
  const [isEditingClient, setIsEditingClient] = useState(false);

  // Master password modal
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSearch = (docType, docNumber) => {
    const localClients = JSON.parse(localStorage.getItem('ersoft_clients') || '[]');
    let found = localClients.find(c => c.docType === docType && c.docNumber === docNumber);
    if (!found) found = simulatedClients.find(c => c.docType === docType && c.docNumber === docNumber);
    setCurrentClient(found || null);
  };

  const handleAddClick = (docType, docNumber) => {
    setIsEditingClient(false);
    setModalInitialDocType(docType);
    setModalInitialDocNumber(docNumber);
    setIsModalOpen(true);
  };

  const handleEditClick = (client) => {
    setShowAuthModal(true);
  };

  const handleAuthConfirm = (pwd) => {
    if (verifyMasterPassword(pwd)) {
      setShowAuthModal(false);
      setIsEditingClient(true);
      setIsModalOpen(true);
      return true;
    }
    return false;
  };

  const handleClientAdded = (newClient) => setCurrentClient(newClient);

  // ── Quick action buttons ─────────────────────────────────────
  const quickActions = [
    { label: 'Calendario',              icon: <FaCalendarAlt size={14} />, path: '/calendario' },
    { label: 'Nueva Venta',             icon: <FaShoppingCart size={14} />, path: '/ventas', state: { preloadedClient: currentClient } },
    { label: 'Tickets / Boletas',       icon: <FaFileInvoiceDollar size={14} />, path: '/tbf' },
    { label: 'Herramientas',            icon: <FaTools size={14} />, path: '/herramientas' },
  ];

  return (
    <div className="flex flex-col gap-4 h-full max-w-5xl mx-auto">

      {/* ── Client Search ── */}
      <Card>
        <ClientSearch onSearch={handleSearch} onAddClick={handleAddClick} />
      </Card>

      {/* ── Client Info ── */}
      <ClientInfo client={currentClient} onEdit={handleEditClick} />

      {/* ── Quick Actions ── */}
      <div className="flex gap-2 flex-wrap">
        {quickActions.map(a => (
          <Btn key={a.label} variant="secondary" size="md" leftIcon={a.icon}
            onClick={() => navigate(a.path, a.state ? { state: a.state } : undefined)}
            className="flex-1 min-w-[130px] justify-center">
            {a.label}
          </Btn>
        ))}
      </div>

      {/* ── Module Cards ── */}
      <div className="flex gap-3 flex-wrap pb-2">
        <ModuleCard icon={<FaUsers size={32} />}   label="USR" onClick={() => navigate('/usuarios')} />
        <ModuleCard icon={<MdInventory size={36} />} label="INV" onClick={() => navigate('/inventario')} />
        <ModuleCard icon={<FaChartBar size={32} />} label="GRF" onClick={() => navigate('/graficos')} />
      </div>

      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDocType={modalInitialDocType}
        initialDocNumber={modalInitialDocNumber}
        onClientAdded={handleClientAdded}
        isEditing={isEditingClient}
        initialClientData={currentClient}
      />

      {showAuthModal && (
        <MasterPasswordModal
          onConfirm={handleAuthConfirm}
          onCancel={() => setShowAuthModal(false)}
          ds={ds}
        />
      )}
    </div>
  );
};

export default Principal;
