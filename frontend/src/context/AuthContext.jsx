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
      const userData = {
        id: 1,
        name: 'Alexander Lee',
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
    // Also update the active session so the header stays in sync
    if (user) {
      const updated = { ...user, username: newUsername };
      sessionStorage.setItem('ersoft_user', JSON.stringify(updated));
      setUser(updated);
    }
  };

  // ── Expose current credentials (for display in Perfil) ──
  const getCredentials = () => loadCredentials();

  const logout = () => {
    sessionStorage.removeItem('ersoft_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, verifyMasterPassword, updateCredentials, getCredentials }}>
      {children}
    </AuthContext.Provider>
  );
};
