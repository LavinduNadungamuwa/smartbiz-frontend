import Icon from './Icon';

export default function StatCard({ label, value, growth, trend = 'up', icon }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">
        <Icon name={icon} />
      </div>
      <div>
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
      </div>
      <span className={`trend ${trend}`}>{growth}</span>
    </article>
  );
}
