import { createContext, useContext, useState } from 'react';
import { decodeToken, logout as apiLogout } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sb_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sb_user');
    return saved ? JSON.parse(saved) : null;
  });

  const saveAuth = (tokenStr) => {
    const payload = decodeToken(tokenStr);
    const role = payload?.roles?.[0] || payload?.role || '';
    localStorage.setItem('sb_token', tokenStr);
    localStorage.setItem('sb_role', role);
    localStorage.setItem('sb_user', JSON.stringify(payload));
    setToken(tokenStr);
    setUser(payload);
  };

  const logout = () => {
    apiLogout();
    setToken(null);
    setUser(null);
  };

  const role = localStorage.getItem('sb_role') || '';
  const isAdmin = role.includes('ADMIN');

  return (
    <AuthContext.Provider value={{ token, user, isAdmin, saveAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
