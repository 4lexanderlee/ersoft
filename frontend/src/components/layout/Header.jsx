import React from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const bgClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-[#e8e3e8] border-gray-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';
  const roleClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';

  const displayName = user ? user.name.toUpperCase() : 'USUARIO';

  return (
    <header className={`flex items-center justify-between px-8 py-4 border-b transition-colors duration-300 ${bgClass}`}>
      {/* Welcome text */}
      <h2 className={`text-xl font-bold ${textClass}`}>
        Bienvenid@, {displayName}
      </h2>

      {/* Role + Toggle */}
      <div className="flex items-center gap-4">
        <span className={`font-medium ${roleClass}`}>{user?.role || 'Master'}</span>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
