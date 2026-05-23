import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// ── Default credentials (used only the very first time, i.e. when localStorage is empty)
const DEFAULT_CREDENTIALS = { username: 'melgarejorom@gmail.com', password: 'master123' };
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
      let profileName = 'Alexander Lee Melgarejo';
      try {
        const savedProfile = localStorage.getItem('ersoft_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.name) {
            profileName = parsed.name.trim();
          }
        }
      } catch (e) {
        profileName = 'Alexander Lee Melgarejo';
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

    // Fallback: check other users in localStorage
    try {
      const savedUsersStr = localStorage.getItem('ersoft_usuarios');
      if (savedUsersStr) {
        const usersList = JSON.parse(savedUsersStr);
        const found = usersList.find(
          u => u.email && u.email.trim().toLowerCase() === username.trim().toLowerCase() && 
               u.password === password && 
               u.status === 'Activo'
        );
        if (found) {
          const userData = {
            id: found.id,
            name: found.name,
            role: found.role,
            username: found.email, // email is the username
            sucursalId: found.sucursalId,
            sucursalName: found.sucursal,
          };
          sessionStorage.setItem('ersoft_user', JSON.stringify(userData));
          setUser(userData);
          return { success: true };
        }
      }
    } catch (e) {
      console.error('Error authenticating against user database:', e);
    }

    return { success: false, error: 'Usuario o contraseña incorrectos' };
  };

  // ── Verify password (master password for Master role, own password for others) ──
  const verifyPassword = (password) => {
    if (!user) return false;
    if (user.role === 'Master') {
      const creds = loadCredentials();
      return creds.password === password;
    }
    try {
      const savedUsersStr = localStorage.getItem('ersoft_usuarios');
      if (savedUsersStr) {
        const usersList = JSON.parse(savedUsersStr);
        const found = usersList.find(u => String(u.id) === String(user.id));
        if (found) {
          return found.password === password;
        }
      }
    } catch (e) {
      console.error('Error verifying user password:', e);
    }
    return false;
  };

  // ── Verify master password (deprecated but kept for fallback compatibility) ──
  const verifyMasterPassword = (password) => {
    return verifyPassword(password);
  };

  // ── Update credentials and refresh session ──
  const updateCredentials = (newUsername, newPassword) => {
    if (!user) return;
    if (user.role === 'Master') {
      const creds = { username: newUsername, password: newPassword };
      localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
      setUser(prev => {
        if (!prev) return prev;
        const updated = { ...prev, username: newUsername };
        sessionStorage.setItem('ersoft_user', JSON.stringify(updated));
        return updated;
      });
    } else {
      try {
        const savedUsersStr = localStorage.getItem('ersoft_usuarios');
        if (savedUsersStr) {
          const usersList = JSON.parse(savedUsersStr);
          const updatedList = usersList.map(u => {
            if (String(u.id) === String(user.id)) {
              return { ...u, email: newUsername, password: newPassword };
            }
            return u;
          });
          localStorage.setItem('ersoft_usuarios', JSON.stringify(updatedList));
        }
        setUser(prev => {
          if (!prev) return prev;
          const updated = { ...prev, username: newUsername };
          sessionStorage.setItem('ersoft_user', JSON.stringify(updated));
          return updated;
        });
      } catch (e) {
        console.error('Error updating standard user credentials:', e);
      }
    }
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
  const getCredentials = () => {
    if (!user) return { username: '', password: '' };
    if (user.role === 'Master') {
      return loadCredentials();
    }
    try {
      const savedUsersStr = localStorage.getItem('ersoft_usuarios');
      if (savedUsersStr) {
        const usersList = JSON.parse(savedUsersStr);
        const found = usersList.find(u => String(u.id) === String(user.id));
        if (found) {
          return { username: found.email, password: found.password };
        }
      }
    } catch (e) {
      console.error('Error getting user credentials:', e);
    }
    return { username: user.username, password: '' };
  };

  const logout = () => {
    sessionStorage.removeItem('ersoft_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, verifyPassword, verifyMasterPassword, updateCredentials, syncProfileName, getCredentials }}>
      {children}
    </AuthContext.Provider>
  );
};
