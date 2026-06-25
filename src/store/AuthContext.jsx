import { useState } from 'react';
import { decodeToken, logout as apiLogout } from '../api/auth';
import AuthContext from './authContextValue';

function isValidTokenString(t) {
  return typeof t === 'string' && t.trim() !== '' && t !== 'undefined' && t !== 'null' && t.split('.').length === 3;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('sb_token');
    if (!isValidTokenString(t)) {
      // ensure we don't keep invalid placeholder values
      localStorage.removeItem('sb_token');
      localStorage.removeItem('sb_role');
      localStorage.removeItem('sb_user');
      return null;
    }
    return t;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sb_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('sb_user');
      return null;
    }
  });

  const saveAuth = (tokenStr, extraFields = {}) => {

  // Prevent fake logins
  if (!tokenStr) {
    return false;
  }

  const payload = decodeToken(tokenStr);

  // Invalid token
  if (!payload) {
    return false;
  }

  const role = payload?.roles?.[0] || payload?.role || '';

  // Merge extra fields (businessName, businessId, etc.) that login already
  // saved into sb_user before calling saveAuth — don't overwrite them.
  let previousExtra = {};
  try {
    previousExtra = JSON.parse(localStorage.getItem('sb_user') || '{}');
  } catch { /* ignore */ }

  const merged = { ...previousExtra, ...extraFields, ...payload };

  localStorage.setItem('sb_token', tokenStr);
  localStorage.setItem('sb_role', role);
  localStorage.setItem('sb_user', JSON.stringify(merged));

  setToken(tokenStr);
  setUser(merged);

  return true;
};

  const logout = () => {
    apiLogout();
    setToken(null);
    setUser(null);
  };

  const updateUser = (fields = {}) => {
    setUser(prev => {
      const updated = { ...(prev || {}), ...fields };
      localStorage.setItem('sb_user', JSON.stringify(updated));
      return updated;
    });
  };

  const role = localStorage.getItem('sb_role') || '';
  const isAdmin = role.includes('ADMIN');

  return (
    <AuthContext.Provider value={{ token, user, isAdmin, saveAuth, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
