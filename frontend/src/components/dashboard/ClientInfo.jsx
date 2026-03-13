import React from 'react';
import { FaBuilding, FaUser, FaPencilAlt } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const ClientInfo = ({ client, onEdit }) => {
  const { theme } = useTheme();
  
  const bgClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`relative w-full p-6 border rounded-lg shadow-sm transition-colors duration-300 ${bgClass}`}>
      {client && onEdit && (
        <button
          onClick={() => onEdit(client)}
          title="Editar cliente"
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors hover:scale-110 active:scale-95
            ${theme === 'dark' ? 'text-gray-400 hover:text-yellow-400 bg-gray-700/50 hover:bg-gray-700' : 'text-gray-500 hover:text-yellow-600 bg-gray-100 hover:bg-gray-200'}
          `}
        >
          <FaPencilAlt size={14} />
        </button>
      )}

      <div className="flex items-center gap-3 mb-4">
        {client?.docType === 'RUC' ? (
          <FaBuilding className="text-blue-500 text-2xl" />
        ) : (
          <FaUser className="text-blue-500 text-2xl" />
        )}
        <h2 className={`text-xl font-bold pr-8 ${textClass}`}>
          {client ? `${client.name} ${client.surname || ''}`.trim() : 'Cliente no encontrado'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <p className={`text-sm mb-1 ${textSecondaryClass}`}>Tipo de Documento</p>
          <p className={`font-medium ${textClass}`}>{client?.docType || '---'}</p>
        </div>
        <div>
          <p className={`text-sm mb-1 ${textSecondaryClass}`}>Nro. Documento</p>
          <p className={`font-medium ${textClass}`}>{client?.docNumber || '---'}</p>
        </div>
        <div>
          <p className={`text-sm mb-1 ${textSecondaryClass}`}>Correo Electrónico</p>
          <p className={`font-medium ${textClass}`}>{client?.correo || 'No especificado'}</p>
        </div>
        <div>
          <p className={`text-sm mb-1 ${textSecondaryClass}`}>Teléfono</p>
          <p className={`font-medium ${textClass}`}>{client?.telefono || 'No especificado'}</p>
        </div>
        <div className="md:col-span-2 lg:col-span-2">
          <p className={`text-sm mb-1 ${textSecondaryClass}`}>Dirección</p>
          <p className={`font-medium ${textClass}`}>{client?.direccionFiscal || 'No especificado'}</p>
        </div>
      </div>
    </div>
  );
};

export default ClientInfo;
