import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// ── Default credentials (used only the very first time, i.e. when localStorage is empty)
const DEFAULT_CREDENTIALS = { username: 'alexander', password: 'master123' };
const CREDS_KEY = 'ersoft_credentials';

/** Read credentials from localStorage, falling back to defaults */
const loadCredentials = () => {
  try {
    const stored = localStorage.getItem(CREDS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return { ...DEFAULT_CREDENTIALS };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('ersoft_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ── Login: always reads credentials from localStorage ──
  const login = (username, password) => {
    const creds = loadCredentials();
    if (username === creds.username && password === creds.password) {
      // Intentar cargar el perfil guardado para obtener el nombre real
      let profileName = 'Usuario';
      try {
        const savedProfile = localStorage.getItem('ersoft_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.name) {
            profileName = parsed.name.trim();
          }
        } else {
          profileName = 'Alexander'; // Default master profile
        }
      } catch (e) {
        profileName = 'Alexander';
      }

      const userData = {
        id: 1,
        name: profileName,
        role: 'Master',
        username: creds.username,
      };
      sessionStorage.setItem('ersoft_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  };

  // ── Verify master password (used by Perfil before allowing edits) ──
  const verifyMasterPassword = (password) => {
    const creds = loadCredentials();
    return creds.password === password;
  };

  // ── Update credentials and refresh session ──
  const updateCredentials = (newUsername, newPassword) => {
    const creds = { username: newUsername, password: newPassword };
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, username: newUsername };
      sessionStorage.setItem('ersoft_user', JSON.stringify(updated));
      return updated;
    });
  };

  // ── Sync user name from Profile updates ──
  const syncProfileName = (name) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      sessionStorage.setItem('ersoft_user', JSON.stringify(updated));
      return updated;
    });
  };

  // ── Expose current credentials (for display in Perfil) ──
  const getCredentials = () => loadCredentials();

  const logout = () => {
    sessionStorage.removeItem('ersoft_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, verifyMasterPassword, updateCredentials, syncProfileName, getCredentials }}>
      {children}
    </AuthContext.Provider>
  );
};
