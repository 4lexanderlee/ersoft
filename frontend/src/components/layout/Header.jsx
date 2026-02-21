import React, { useState, useEffect } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const PROFILE_KEY = 'ersoft_profile';

const getProfileData = () => {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      const p = JSON.parse(saved);
      return { sexo: p.sexo || 'Masculino', name: p.name || null };
    }
  } catch (_) {}
  return { sexo: 'Masculino', name: null };
};

const Header = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(getProfileData);

  // Re-read name + gender whenever profile is saved
  useEffect(() => {
    const onStorage = () => setProfileData(getProfileData());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const bgClass   = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-[#e8e3e8] border-gray-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';
  const roleClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';

  const greeting    = profileData.sexo === 'Femenino' ? 'Bienvenida' : 'Bienvenido';
  // Use saved profile name if available, fall back to auth name
  const displayName = (profileData.name || (user ? user.name : 'USUARIO')).toUpperCase();

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
