import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import {
  AuthBrandPanel,
  AuthFormCard,
  FormError,
  FormField,
  PasswordField,
  PrimaryButton,
} from '../../components/auth';
import useAuth from '../../store/useAuth';
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
    setError('');

    if (!form.email || !form.password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await login(form);

      if (!res.data.token) {
        setError(res.data.message || 'Invalid credentials');
        return;
      }

      const success = saveAuth(res.data.token);

      if (!success) {
        setError('Authentication failed');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <AuthBrandPanel />
      <AuthFormCard
        title="Welcome back!"
        subtitle="Sign in to your SmartBiz account"
        footer={(
          <>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="form-link">
              Create one free
            </Link>
          </>
        )}
      >
        <FormError message={error} />
        <form onSubmit={handleSubmit} noValidate>
          <FormField
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@business.com"
            value={form.email}
            onChange={handleChange}
          />

          <PasswordField
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="********"
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
          />

          <PrimaryButton loading={loading} loadingText="Signing in...">
            Sign in
          </PrimaryButton>
        </form>
      </AuthFormCard>
    </div>
  );
}
