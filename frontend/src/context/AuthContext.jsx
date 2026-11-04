import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// ── Default credentials (used only the very first time, i.e. when localStorage is empty)
const DEFAULT_CREDENTIALS = { username: 'melgarejorom@gmail.com', password: 'master123' };
const CREDS_KEY = 'ersoft_credentials';
const USER_SESSION_KEY = 'ersoft_user';

const ROLE_LABELS = {
  MASTER: 'Master',
  ADMINISTRADOR: 'Administrador',
  CAJERO: 'Cajero',
  ALMACENERO: 'Almacenero',
};

const normalizeRole = (role) => String(role || '').trim().toUpperCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Keeps the legacy camelCase fields while exposing the RBAC session contract.
const toSessionUser = (data) => {
  const rol = normalizeRole(data.rol || data.role) || 'MASTER';
  const sucursalId = rol === 'MASTER' ? null : (data.sucursal_id ?? data.sucursalId ?? '1');
  const sucursalNombre = rol === 'MASTER'
    ? 'Todas las sucursales'
    : (data.sucursal_nombre ?? data.sucursalName ?? data.sucursal ?? 'Sede Principal');

  return {
    ...data,
    rol,
    role: ROLE_LABELS[rol] || data.role || rol,
    sucursal_id: sucursalId,
    sucursal_nombre: sucursalNombre,
    // Compatibility for existing views while they migrate to the snake_case contract.
    sucursalId,
    sucursalName: sucursalNombre,
  };
};

const persistUser = (userData) => {
  sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
  return userData;
};

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
    try {
      const savedUser = sessionStorage.getItem(USER_SESSION_KEY);
      return savedUser ? toSessionUser(JSON.parse(savedUser)) : null;
    } catch (_) {
      return null;
    }
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
        rol: 'MASTER',
        username: creds.username,
      };
      const sessionUser = persistUser(toSessionUser(userData));
      setUser(sessionUser);
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
            rol: found.rol || found.role,
            username: found.email, // email is the username
            sucursal_id: found.sucursal_id ?? found.sucursalId,
            sucursal_nombre: found.sucursal_nombre ?? found.sucursal,
          };
          const sessionUser = persistUser(toSessionUser(userData));
          setUser(sessionUser);
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
    if (user.rol === 'MASTER') {
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
    if (user.rol === 'MASTER') {
      const creds = { username: newUsername, password: newPassword };
      localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
      setUser(prev => {
        if (!prev) return prev;
        const updated = toSessionUser({ ...prev, username: newUsername });
        persistUser(updated);
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
          const updated = toSessionUser({ ...prev, username: newUsername });
          persistUser(updated);
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
      const updated = toSessionUser({ ...prev, name });
      persistUser(updated);
      return updated;
    });
  };

  // ── Expose current credentials (for display in Perfil) ──
  const getCredentials = () => {
    if (!user) return { username: '', password: '' };
    if (user.rol === 'MASTER') {
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
    sessionStorage.removeItem(USER_SESSION_KEY);
    setUser(null);
  };

  // Development-only UI can switch roles without changing credentials or user data.
  const simulateRole = (rol) => {
    const normalizedRole = normalizeRole(rol);
    if (!ROLE_LABELS[normalizedRole]) return;
    setUser(prev => {
      if (!prev) return prev;
      const simulatedUser = toSessionUser({
        ...prev,
        rol: normalizedRole,
        sucursal_id: normalizedRole === 'MASTER' ? null : (prev.sucursal_id ?? '1'),
      });
      persistUser(simulatedUser);
      return simulatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, verifyPassword, verifyMasterPassword, updateCredentials, syncProfileName, getCredentials, simulateRole }}>
      {children}
    </AuthContext.Provider>
  );
};
