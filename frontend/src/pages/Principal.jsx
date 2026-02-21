import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientSearch from '../components/dashboard/ClientSearch';
import ClientInfo from '../components/dashboard/ClientInfo';
import AddClientModal from '../components/modals/AddClientModal';
import { simulatedClients } from '../data/simulatedClients';
import { useTheme } from '../context/ThemeContext';
import { FaCalendarAlt, FaShoppingCart, FaFileInvoiceDollar, FaTools, FaUsers, FaChartBar } from 'react-icons/fa';
import { MdInventory } from 'react-icons/md';

// Quick access button component
const QuickBtn = ({ label, onClick, theme }) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[120px] py-5 px-4 rounded-full font-semibold text-sm shadow transition-all hover:scale-105 active:scale-95
      ${theme === 'dark'
        ? 'bg-gray-700 text-white hover:bg-gray-600'
        : 'bg-white text-gray-900 hover:bg-gray-50 shadow-md'
      }
    `}
  >
    {label}
  </button>
);

// Module card component  
const ModuleCard = ({ label, bgColor, children, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[120px] h-36 rounded-xl flex flex-col items-center justify-center text-white font-bold text-2xl shadow-lg
      transition-transform hover:scale-105 active:scale-95 overflow-hidden ${bgColor}`}
  >
    {children}
  </button>
);

const Principal = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentClient, setCurrentClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDocType, setModalInitialDocType] = useState('DNI');
  const [modalInitialDocNumber, setModalInitialDocNumber] = useState('');

  const handleSearch = (docType, docNumber) => {
    const localClients = JSON.parse(localStorage.getItem('ersoft_clients') || '[]');
    let found = localClients.find(c => c.docType === docType && c.docNumber === docNumber);
    if (!found) {
      found = simulatedClients.find(c => c.docType === docType && c.docNumber === docNumber);
    }
    setCurrentClient(found || null);
  };

  const handleAddClick = (docType, docNumber) => {
    setModalInitialDocType(docType);
    setModalInitialDocNumber(docNumber);
    setIsModalOpen(true);
  };

  const handleClientAdded = (newClient) => {
    setCurrentClient(newClient);
  };

  const bgSection = theme === 'dark' ? 'bg-gray-800/60 border-gray-700' : 'bg-white/60 border-gray-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textMuted = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const footerBg = theme === 'dark' ? 'bg-gray-900/40' : 'bg-black';

  return (
    <div className="flex flex-col gap-5 h-full max-w-5xl mx-auto">

      {/* Client Search Section */}
      <div className={`rounded-xl border px-6 py-5 ${bgSection}`}>
        <ClientSearch onSearch={handleSearch} onAddClick={handleAddClick} />
      </div>

      {/* Client Info */}
      <ClientInfo client={currentClient} />

      {/* Quick Access Buttons */}
      <div className="flex gap-3 flex-wrap">
        <QuickBtn label="Calendario" onClick={() => navigate('/calendario')} theme={theme} />
        <QuickBtn label="Venta" onClick={() => navigate('/ventas', { state: { preloadedClient: currentClient } })} theme={theme} />
        <QuickBtn label="Tickets / Boletas Facturas" onClick={() => navigate('/tbf')} theme={theme} />
        <QuickBtn label="Herramientas" onClick={() => navigate('/herramientas')} theme={theme} />
      </div>

      {/* Module Cards */}
      <div className="flex gap-3 flex-wrap pb-2">
        {/* USR */}
        <ModuleCard label="USR" bgColor="bg-[#1a1a1a]" onClick={() => navigate('/usuarios')}>
          <FaUsers size={40} className="mb-1 opacity-80" />
          <span className="text-sm font-bold tracking-widest opacity-90">USR</span>
        </ModuleCard>
        {/* INV */}
        <ModuleCard label="INV" bgColor="bg-[#1a1a1a]" onClick={() => navigate('/inventario')}>
          <MdInventory size={44} className="mb-1 opacity-80" />
          <span className="text-sm font-bold tracking-widest opacity-90">INV</span>
        </ModuleCard>
        {/* GRF */}
        <ModuleCard label="GRF" bgColor="bg-[#1a1a1a]" onClick={() => navigate('/graficos')}>
          <FaChartBar size={40} className="mb-1 opacity-80" />
          <span className="text-sm font-bold tracking-widest opacity-90">GRF</span>
        </ModuleCard>
      </div>

      {/* Footer */}
      <div className={`rounded-lg py-2 px-4 text-center text-xs text-gray-400 mt-auto ${footerBg}`}>
        ®Todos los derechos reservados. ERSOFT
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
