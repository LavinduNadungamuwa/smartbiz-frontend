export default function Toggle({ label, checked = true }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" defaultChecked={checked} />
      <i />
    </label>
  );
}
