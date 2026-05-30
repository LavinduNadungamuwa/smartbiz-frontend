import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../api/auth';
import {
  AuthBrandPanel,
  AuthFormCard,
  FormError,
  FormField,
  PasswordField,
  PasswordStrength,
  PrimaryButton,
} from '../../components/auth';
import useAuth from '../../store/useAuth';
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

const BRAND_FEATURES = [
  'Free to get started',
  'AI-powered insights',
  'Invoice & payment tracking',
  'Inventory & stock alerts',
];

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
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setApiError('');
    setLoading(true);

    try {
      const payload = {
        businessName: form.businessName,
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
      };

      const res = await register(payload);

      if (!res.data?.token) {
        setApiError(res.data?.message || 'Registration failed');
        return;
      }

      const success = saveAuth(res.data.token);

      if (!success) {
        setApiError('Authentication failed');
        return;
      }

      navigate('/login');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <AuthBrandPanel
        subtitle="Everything your business needs - in one place."
        features={BRAND_FEATURES}
      />
      <AuthFormCard
        title="Create your account"
        subtitle="Set up SmartBiz for your business in seconds"
        wide
        footer={(
          <>
            Already have an account?{' '}
            <Link to="/login" className="form-link">
              Sign in
            </Link>
          </>
        )}
      >
        <FormError message={apiError} />
        <form onSubmit={handleSubmit} noValidate>
          <div className="field-row">
            <FormField
              name="businessName"
              label="Business name"
              placeholder="Acme Retail Ltd."
              value={form.businessName}
              error={errors.businessName}
              onChange={handleChange}
              half
            />
            <FormField
              name="ownerName"
              label="Owner name"
              placeholder="Jane Smith"
              value={form.ownerName}
              error={errors.ownerName}
              onChange={handleChange}
              half
            />
          </div>

          <div className="field-row">
            <FormField
              name="email"
              label="Email address"
              type="email"
              placeholder="jane@acme.com"
              value={form.email}
              error={errors.email}
              onChange={handleChange}
              half
            />
            <FormField
              name="phone"
              label="Phone number"
              type="tel"
              placeholder="+94 77 123 4567"
              value={form.phone}
              error={errors.phone}
              onChange={handleChange}
              half
            />
          </div>

          <FormField
            name="address"
            label="Business address"
            placeholder="42 Main St, Colombo"
            value={form.address}
            error={errors.address}
            onChange={handleChange}
          />

          <div className="field-divider">
            <span>Account security</span>
          </div>

          <div className="field-row">
            <PasswordField
              name="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              half
            />
            <FormField
              name="confirmPassword"
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat password"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              half
            />
          </div>

          {form.password && <PasswordStrength password={form.password} />}

          <PrimaryButton loading={loading} loadingText="Creating account...">
            Create account
          </PrimaryButton>
        </form>
      </AuthFormCard>
    </div>
  );
}
