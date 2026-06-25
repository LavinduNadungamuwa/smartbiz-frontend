export default function AuthFormCard({
  title,
  subtitle,
  wide = false,
  children,
  footer,
}) {
  return (
    <div className="auth-panel auth-panel--form">
      <div className={`form-card${wide ? ' form-card--wide' : ''}`}>
        <div className="form-header">
          <h2 className="form-title">{title}</h2>
          <p className="form-subtitle">{subtitle}</p>
        </div>

        {children}

        {footer && <p className="form-footer">{footer}</p>}
      </div>
    </div>
  );
}
