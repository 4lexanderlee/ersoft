import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors duration-300 flex items-center justify-center
        ${theme === 'light' ? 'bg-white border border-gray-400 text-gray-800 hover:bg-gray-100' : 'bg-gray-700 border border-gray-600 text-yellow-400 hover:bg-gray-600'}
      `}
      aria-label="Toggle Dark Mode"
    >
      {theme === 'light' ? <FaMoon size={18} /> : <FaSun size={18} />}
    </button>
  );
};

export default ThemeToggle;
