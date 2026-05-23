import React, { useState, useEffect } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const getProfileData = (currentUser) => {
  if (!currentUser) return { sexo: 'Masculino', name: 'USUARIO' };
  if (currentUser.role === 'Master') {
    try {
      const saved = localStorage.getItem('ersoft_profile');
      if (saved) {
        const p = JSON.parse(saved);
        return { sexo: p.sexo || 'Masculino', name: p.name || currentUser.name };
      }
    } catch (_) {}
    return { sexo: 'Masculino', name: currentUser.name };
  } else {
    try {
      const savedUsersStr = localStorage.getItem('ersoft_usuarios');
      if (savedUsersStr) {
        const usersList = JSON.parse(savedUsersStr);
        const found = usersList.find(u => String(u.id) === String(currentUser.id));
        if (found) {
          return { sexo: found.sexo || 'Masculino', name: found.name || currentUser.name };
        }
      }
    } catch (_) {}
    return { sexo: 'Masculino', name: currentUser.name };
  }
};

const Header = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(() => getProfileData(user));

  // Re-read name + gender whenever user changes or storage is updated
  useEffect(() => {
    setProfileData(getProfileData(user));
  }, [user]);

  useEffect(() => {
    const onStorage = () => setProfileData(getProfileData(user));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);

  const bgClass   = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-[#e8e3e8] border-gray-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';
  const roleClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';

  const greeting    = profileData.sexo === 'Femenino' ? 'Bienvenida' : 'Bienvenido';
  const displayName = (profileData.name || 'USUARIO').toUpperCase();

  return (
    <header className={`flex items-center justify-between px-8 py-4 border-b transition-colors duration-300 ${bgClass}`}>
      {/* Welcome text */}
      <h2 className={`text-xl font-bold ${textClass}`}>
        {greeting}, {displayName}
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
