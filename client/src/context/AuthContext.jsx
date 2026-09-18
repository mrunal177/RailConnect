import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('railconnect_user')) || null; } catch { return null; }
  });

  const login = (userData, token) => {
    const session = { ...userData, token };
    localStorage.setItem('railconnect_token', token);
    localStorage.setItem('railconnect_user', JSON.stringify(session));
    setUser(session);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('railconnect_token');
    localStorage.removeItem('railconnect_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
