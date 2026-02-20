import React, { useState } from 'react';
import { FaSearch, FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const ClientSearch = ({ onSearch, onAddClick }) => {
  const { theme } = useTheme();
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const docTypes = [
    { type: 'DNI', maxLength: 8 },
    { type: 'CE',  maxLength: 9 },
    { type: 'RUC', maxLength: 11 },
  ];

  const currentTypeConfig = docTypes.find(t => t.type === docType);

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // only digits
    if (value.length <= currentTypeConfig.maxLength) {
      setDocNumber(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(docType, docNumber);
    }
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const bgInputClass = theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500 text-white' : 'bg-white border-gray-300 focus:border-blue-500 text-gray-900';
  const iconClass = theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100';

  return (
    <div className="flex gap-2 w-full max-w-2xl relative">
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className={`flex items-center gap-2 px-4 py-2 border rounded-l-md h-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${bgInputClass}`}
        >
          {docType}
          {isDropdownOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </button>
        
        {isDropdownOpen && (
          <div className={`absolute top-full left-0 mt-1 w-24 border rounded-md shadow-lg z-10 
            ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          `}>
            {docTypes.map(t => (
              <button
                key={t.type}
                className={`w-full text-left px-4 py-2 hover:bg-blue-500 hover:text-white transition-colors
                  ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                `}
                onClick={() => {
                  setDocType(t.type);
                  setDocNumber('');
                  setIsDropdownOpen(false);
                }}
              >
                {t.type}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex-1 flex items-center">
        <div className={`absolute left-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaSearch />
        </div>
        <input
          type="text"
          value={docNumber}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={`Digite aquí la documentación del cliente`}
          className={`w-full pl-10 pr-4 py-2 border h-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${bgInputClass} ${docType === 'RUC' ? 'rounded-r-md' : ''}`}
        />
      </div>

      <button
        onClick={() => onAddClick(docType, docNumber)}
        className={`px-4 py-2 border rounded-r-md transition-colors flex items-center justify-center ${iconClass} ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
        title="Agregar Cliente"
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default ClientSearch;
