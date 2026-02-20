import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Master user credentials
const USERS = [
  {
    id: 1,
    username: 'alexander',
    password: 'master123',
    name: 'Alexander Lee',
    role: 'Master',
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('ersoft_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (username, password) => {
    const found = USERS.find(
      u => u.username === username && u.password === password
    );
    if (found) {
      const userData = { id: found.id, name: found.name, role: found.role, username: found.username };
      sessionStorage.setItem('ersoft_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  };

  const logout = () => {
    sessionStorage.removeItem('ersoft_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
