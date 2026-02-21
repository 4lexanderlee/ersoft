/**
 * PageHeader — The standard sub-page top bar shared by
 * Inventario, TBF, Perfil, Empresa, Lotes, Ventas.
 *
 * Props:
 *   onBack      function — navigate back (usually navigate('/principal'))
 *   backLabel   string   (default: 'Volver al menú')
 *   right       React node — optional right-side slot
 */
import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useDS } from '../../hooks/useDS';

const PageHeader = ({ onBack, backLabel = 'Volver al menú', right }) => {
  const { headerBg, text } = useDS();

  return (
    <div className={`flex items-center justify-between px-8 py-4 border-b shrink-0 ${headerBg}`}>
      <button
        onClick={onBack}
        className={`flex items-center gap-2 font-bold text-base transition-opacity hover:opacity-60 ${text}`}
      >
        <FaArrowLeft size={14} />
        {backLabel}
      </button>
      {right && <div className="flex items-center gap-4">{right}</div>}
    </div>
  );
};

export default PageHeader;
