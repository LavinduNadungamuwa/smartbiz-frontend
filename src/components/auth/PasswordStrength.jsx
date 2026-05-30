export default function PasswordStrength({ password }) {
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#e55', '#f90', '#4caf50', '#2196f3'];

  return (
    <div className="pw-strength">
      <div className="pw-strength__bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="pw-strength__bar"
            style={{ background: i <= score ? colors[score] : undefined }}
          />
        ))}
      </div>
      <span className="pw-strength__label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}
