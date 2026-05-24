import client from './axiosClient';

/**
 * POST /api/auth/register
 * Body: { businessName, ownerName, email, password, phone, address }
 * Returns: { token, message }
 */
export const register = (data) => client.post('/api/auth/register', data);

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, message }
 */
export const login = (data) => client.post('/api/auth/login', data);

/**
 * Decode JWT payload (no signature verification — server does that)
 */
export const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('sb_token');
  localStorage.removeItem('sb_role');
  localStorage.removeItem('sb_user');
};
