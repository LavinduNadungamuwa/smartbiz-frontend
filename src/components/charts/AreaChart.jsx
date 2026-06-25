export default function AreaChart({ labels = [], values = [], data = [] }) {
  const chartValues = values.length ? values : data;
  if (!chartValues.length) return null;

  const n = Math.max(chartValues.length, 1);
  const max = Math.max(...chartValues, 1);

  // Scale value to [6, 96] range to match LineChart scaling
  const scaledValues = chartValues.map((v) => Math.max(6, Math.round((v / max) * 96)));

  const points = scaledValues.map((value, index) => {
    const x = n === 1 ? 50 : (index / (n - 1)) * 100;
    const y = 100 - value;
    return `${x},${y}`;
  }).join(' ');

  const polygonPoints = `0,100 ${points} 100,100`;

  return (
    <div className="chart area-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points={polygonPoints} />
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

