import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDS } from '../hooks/useDS';
import ClientSearch from '../components/dashboard/ClientSearch';
import ClientInfo from '../components/dashboard/ClientInfo';
import AddClientModal from '../components/modals/AddClientModal';
import { simulatedClients } from '../data/simulatedClients';
import Btn from '../components/ui/Btn';
import Card from '../components/ui/Card';
import {
  FaShoppingCart, FaFileInvoiceDollar, FaTools, FaUsers, FaChartBar, FaCalendarAlt
} from 'react-icons/fa';
import { MdInventory } from 'react-icons/md';

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
  const [currentClient, setCurrentClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDocType, setModalInitialDocType] = useState('DNI');
  const [modalInitialDocNumber, setModalInitialDocNumber] = useState('');

  const handleSearch = (docType, docNumber) => {
    const localClients = JSON.parse(localStorage.getItem('ersoft_clients') || '[]');
    let found = localClients.find(c => c.docType === docType && c.docNumber === docNumber);
    if (!found) found = simulatedClients.find(c => c.docType === docType && c.docNumber === docNumber);
    setCurrentClient(found || null);
  };

  const handleAddClick = (docType, docNumber) => {
    setModalInitialDocType(docType);
    setModalInitialDocNumber(docNumber);
    setIsModalOpen(true);
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
      <ClientInfo client={currentClient} />

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
      />
    </div>
  );
};

export default Principal;
