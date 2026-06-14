export default function AreaChart({ labels = [], values = [], data = [] }) {
  const chartValues = values.length ? values : data;
  const n = Math.max(chartValues.length, 1);

  // Calculate max to determine clean ceiling in intervals of 5000
  const step = 2500;
  const chartMax = Math.ceil(Math.max(...chartValues, 1) / step) * step;

  // Chart drawing area inside SVG (stretch to fill full width, leave vertical bounds)
  const x0 = 0;
  const x1 = 100;
  const y0 = 10; // top bound
  const y1 = 80; // bottom bound
  const width = x1 - x0; // 100
  const height = y1 - y0; // 70

  // Compute points for polyline / polygon relative to chartMax
  const points = chartValues.map((v, i) => {
    const x = x0 + (n === 1 ? 0.5 * width : (i / (n - 1)) * width);
    const y = y0 + (1 - (v / chartMax)) * height;
    return `${x},${y}`;
  }).join(' ');

  // Polygon includes baseline to close area
  const polygonPoints = ` ${x0},${y1} ${points} ${x1},${y1} `;

  // Y-axis ticks in intervals of 5000
  const tickRows = [];
  for (let val = 0; val <= chartMax; val += step) {
    const y = y0 + (1 - (val / chartMax)) * height;
    tickRows.push({ y, value: val });
  }
  tickRows.reverse(); // highest first for nicer ordering

  // Currency formatter - format as USD currency (no decimal places)
  const currencyFmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="chart area-chart" style={{ position: 'relative', paddingLeft: '60px', paddingRight: '15px' }}>
      {/* HTML container for Y-axis labels positioned absolute to avoid stretching */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '52px',
        height: '180px',
        pointerEvents: 'none',
      }}>
        {tickRows.map((tick, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              right: 0,
              top: `${tick.y}%`,
              transform: 'translateY(-50%)',
              fontSize: '11px',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}
          >
            {currencyFmt.format(tick.value)}
          </div>
        ))}
      </div>

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '180px', display: 'block' }}>
        {/* Y axis grid lines */}
        {tickRows.map((tick, idx) => (
          <g key={idx}>
            <line x1={x0} y1={tick.y} x2={x1} y2={tick.y} stroke="var(--border)" strokeWidth="0.3" strokeDasharray="2 2" />
          </g>
        ))}

        {/* Area */}
        <polygon points={polygonPoints} fill="rgba(59,130,246,0.12)" stroke="none" />
        <polyline points={points} fill="none" stroke="var(--blue)" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />

        {/* X axis ticks */}
        {labels.map((lab, i) => {
          const x = x0 + (n === 1 ? 0.5 * width : (i / (n - 1)) * width);
          return (
            <g key={i}>
              <line x1={x} y1={y1} x2={x} y2={y1 + 2.5} stroke="var(--muted)" strokeWidth="0.4" />
            </g>
          );
        })}
      </svg>

      {/* X labels rendered below SVG for readability */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', marginTop: '6px', fontSize: '11px', color: 'var(--muted)' }}>
        {labels.map((lab, i) => (
          <div key={i} style={{ flex: 1, textAlign: i === 0 ? 'left' : i === labels.length - 1 ? 'right' : 'center', minWidth: 0, paddingLeft: i === 0 ? '4px' : 0, paddingRight: i === labels.length - 1 ? '4px' : 0 }}>
            {lab}
          </div>
        ))}
      </div>

      {/* Axis titles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'var(--muted)' }}>
        <div style={{ fontWeight: 700 }}>Value</div>
        <div style={{ fontWeight: 700 }}>Time Period</div>
      </div>
    </div>
  );
}
