export default function Toggle({ label, checked = false, onChange = () => {}, ariaLabel }) {
  return (
    <label className="toggle-row">
      {label ? <span>{label}</span> : null}
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
      />
      <i />
    </label>
  );
}
