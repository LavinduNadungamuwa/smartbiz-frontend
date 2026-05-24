import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAuth } from '../../store/AuthContext';
import './auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await login(form);
      saveAuth(res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* Left panel — branding */}
      <div className="auth-panel auth-panel--brand">
        <div className="brand-content">
          <div className="brand-logo">
            <span className="brand-logo__icon">SB</span>
          </div>
          <h1 className="brand-title">SmartBiz</h1>
          <p className="brand-sub">
            AI-powered business management for small &amp; medium enterprises
          </p>
          <ul className="brand-features">
            <li><span className="feat-dot" />Sales &amp; invoice tracking</li>
            <li><span className="feat-dot" />Inventory management</li>
            <li><span className="feat-dot" />AI business insights</li>
            <li><span className="feat-dot" />Customer &amp; supplier CRM</li>
          </ul>
        </div>
        <div className="brand-grid" aria-hidden="true">
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} className="brand-grid__cell" />
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-panel auth-panel--form">
        <div className="form-card">
          <div className="form-header">
            <h2 className="form-title">Welcome back</h2>
            <p className="form-subtitle">Sign in to your SmartBiz account</p>
          </div>

          {error && (
            <div className="form-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field__label" htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="field__input"
                placeholder="you@business.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">
                Password
              </label>
              <div className="field__password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="field__input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="field__eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn-primary${loading ? ' btn-primary--loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="form-footer">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="form-link">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
