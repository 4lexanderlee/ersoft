import React from 'react';
import { useTheme } from '../context/ThemeContext';

const Placeholder = ({ title }) => {
  const { theme } = useTheme();
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtitleClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const cardClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
      <div className={`p-12 rounded-2xl border text-center ${cardClass}`}>
        <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>{title}</h1>
        <p className={`text-sm ${subtitleClass}`}>Módulo en construcción. Próximamente disponible.</p>
      </div>
    </div>
  );
};

export default Placeholder;
