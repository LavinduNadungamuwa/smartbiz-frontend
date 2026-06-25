export default function StatusBadge({ children }) {
  const key = String(children).toLowerCase().replaceAll(' ', '-');
  return <span className={`status-badge ${key}`}>{children}</span>;
}
