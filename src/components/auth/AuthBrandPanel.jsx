const DEFAULT_FEATURES = [
  'Sales & invoice tracking',
  'Inventory management',
  'AI business insights',
  'Customer & supplier CRM',
];

export default function AuthBrandPanel({
  subtitle = 'AI-powered business management for small & medium enterprises',
  features = DEFAULT_FEATURES,
}) {
  return (
    <div className="auth-panel auth-panel--brand">
      <div className="brand-content">
        <div className="brand-logo">
          <span className="brand-logo__icon">SB</span>
        </div>
        <h1 className="brand-title">SmartBiz</h1>
        <p className="brand-sub">{subtitle}</p>
        <ul className="brand-features">
          {features.map((feature) => (
            <li key={feature}>
              <span className="feat-dot" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="brand-grid" aria-hidden="true">
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} className="brand-grid__cell" />
        ))}
      </div>
    </div>
  );
}
