export default function AreaChart({ data }) {
  const line = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - value;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="chart area-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points={`0,100 ${line} 100,100`} />
        <polyline points={line} />
      </svg>
    </div>
  );
}
