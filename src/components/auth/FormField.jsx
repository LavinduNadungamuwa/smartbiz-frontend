export default function FormField({
  name,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  autoComplete = name,
  half = false,
}) {
  return (
    <div className={`field${half ? ' field--half' : ''}`}>
      <label className="field__label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className={`field__input${error ? ' field__input--error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
