export default function ChartCard({ title, subtitle, children }) {
  return (
    <section className="card chart-card">
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
