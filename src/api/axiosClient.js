import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb_token');

  // don't add Authorization header for auth endpoints (login/register)
  if (config.url?.includes('/api/auth')) return config;

  // Strictly validate token: must be a non-empty string and not the literal 'undefined'/'null'
  if (typeof token === 'string' && token.trim() !== '' && token !== 'undefined' && token !== 'null') {
    const parts = token.split('.');
    if (parts.length === 3) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }
  }

  // remove any invalid token values to avoid sending them
  if (token) {
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_role');
    localStorage.removeItem('sb_user');
  }

  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sb_token');
      localStorage.removeItem('sb_role');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
