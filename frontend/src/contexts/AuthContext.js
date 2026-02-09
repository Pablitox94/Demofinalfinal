import React, { createContext, useContext, useEffect } from 'react';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  useEffect(() => {
    // Limpiar cualquier dato de usuario del localStorage
    localStorage.removeItem('demo_user');
  }, []);

  // Sin sistema de usuarios - todo es local a la máquina
  const value = {
    user: null,
    loading: false,
    login: async () => Promise.resolve(),
    register: async () => Promise.resolve(),
    logout: async () => Promise.resolve()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};