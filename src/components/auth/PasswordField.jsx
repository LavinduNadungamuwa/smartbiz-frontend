export default function PasswordField({
  name = 'password',
  label = 'Password',
  placeholder = '',
  value,
  onChange,
  error = '',
  autoComplete = 'current-password',
  showPassword,
  onToggleShow,
  half = false,
}) {
  return (
    <div className={`field${half ? ' field--half' : ''}`}>
      <label className="field__label" htmlFor={name}>
        {label}
      </label>
      <div className="field__password-wrap">
        <input
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`field__input${error ? ' field__input--error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className="field__eye"
          onClick={onToggleShow}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
