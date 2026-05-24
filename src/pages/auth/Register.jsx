import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../api/auth';
import { useAuth } from '../../store/AuthContext';
import './auth.css';

const INITIAL = {
  businessName: '',
  ownerName: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
};

export default function Register() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.businessName.trim()) errs.businessName = 'Business name is required.';
    if (!form.ownerName.trim()) errs.ownerName = 'Owner name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email.';
    if (!form.phone.trim()) errs.phone = 'Phone number is required.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) errs.password = 'At least 6 characters.';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...payload } = form;
      const res = await register(payload);
      saveAuth(res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
          err.response?.data ||
          'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', placeholder = '', half = false) => (
    <div className={`field${half ? ' field--half' : ''}`}>
      <label className="field__label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        className={`field__input${errors[name] ? ' field__input--error' : ''}`}
        placeholder={placeholder}
        value={form[name]}
        onChange={handleChange}
        autoComplete={name}
      />
      {errors[name] && <span className="field__error">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="auth-root">
      {/* Left brand panel */}
      <div className="auth-panel auth-panel--brand">
        <div className="brand-content">
          <div className="brand-logo">
            <span className="brand-logo__icon">SB</span>
          </div>
          <h1 className="brand-title">SmartBiz</h1>
          <p className="brand-sub">
            Everything your business needs — in one place.
          </p>
          <ul className="brand-features">
            <li><span className="feat-dot" />Free to get started</li>
            <li><span className="feat-dot" />AI-powered insights</li>
            <li><span className="feat-dot" />Invoice &amp; payment tracking</li>
            <li><span className="feat-dot" />Inventory &amp; stock alerts</li>
          </ul>
        </div>
        <div className="brand-grid" aria-hidden="true">
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} className="brand-grid__cell" />
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel auth-panel--form">
        <div className="form-card form-card--wide">
          <div className="form-header">
            <h2 className="form-title">Create your account</h2>
            <p className="form-subtitle">Set up SmartBiz for your business in seconds</p>
          </div>

          {apiError && (
            <div className="form-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-row">
              {field('businessName', 'Business name', 'text', 'Acme Retail Ltd.', true)}
              {field('ownerName', 'Owner name', 'text', 'Jane Smith', true)}
            </div>

            <div className="field-row">
              {field('email', 'Email address', 'email', 'jane@acme.com', true)}
              {field('phone', 'Phone number', 'tel', '+94 77 123 4567', true)}
            </div>

            {field('address', 'Business address', 'text', '42 Main St, Colombo')}

            <div className="field-divider">
              <span>Account security</span>
            </div>

            <div className="field-row">
              <div className="field field--half">
                <label className="field__label" htmlFor="password">Password</label>
                <div className="field__password-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`field__input${errors.password ? ' field__input--error' : ''}`}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="field__eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide' : 'Show'}
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="field__error">{errors.password}</span>}
              </div>

              <div className="field field--half">
                <label className="field__label" htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`field__input${errors.confirmPassword ? ' field__input--error' : ''}`}
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <span className="field__error">{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            {/* Password strength indicator */}
            {form.password && (
              <PasswordStrength password={form.password} />
            )}

            <button
              type="submit"
              className={`btn-primary${loading ? ' btn-primary--loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="form-footer">
            Already have an account?{' '}
            <Link to="/login" className="form-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#e55', '#f90', '#4caf50', '#2196f3'];

  return (
    <div className="pw-strength">
      <div className="pw-strength__bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="pw-strength__bar"
            style={{ background: i <= score ? colors[score] : undefined }}
          />
        ))}
      </div>
      <span className="pw-strength__label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}
