import React, { useState } from 'react';
import { FaSync } from 'react-icons/fa';

const RefreshButton = ({ onRefresh }) => {
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    if (spinning) return;
    setSpinning(true);
    onRefresh();
    setTimeout(() => {
      setSpinning(false);
    }, 1000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Refrescar datos"
      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer
        ${spinning 
          ? 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10' 
          : 'text-gray-400 border-gray-300 dark:border-gray-600 hover:text-yellow-500 hover:border-yellow-500/50 dark:hover:text-yellow-400 dark:hover:border-yellow-400/50 bg-transparent'
        }`}
    >
      <FaSync size={13} className={spinning ? 'animate-spin' : ''} />
    </button>
  );
};

export default RefreshButton;
