export default function LineChart({ data, labels = [] }) {
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - value;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="chart line-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points={points} />
      </svg>
      <div className="chart-axis">
        {(labels.length ? labels : ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov']).map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
