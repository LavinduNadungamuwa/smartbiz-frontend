export default function AreaChart({ labels = [], values = [], data = [] }) {
  const chartValues = values.length ? values : data;
  const n = Math.max(chartValues.length, 1);
  const max = Math.max(...chartValues, 1);

  // Chart drawing area inside SVG (stretch to fill full width, leave vertical bounds)
  const x0 = 0;
  const x1 = 100;
  const y0 = 10; // top bound
  const y1 = 80; // bottom bound
  const width = x1 - x0; // 100
  const height = y1 - y0; // 70

  // Compute points for polyline / polygon
  const points = chartValues.map((v, i) => {
    const x = x0 + (n === 1 ? 0.5 * width : (i / (n - 1)) * width);
    const y = y0 + (1 - (v / max)) * height;
    return `${x},${y}`;
  }).join(' ');

  // Polygon includes baseline to close area
  const polygonPoints = ` ${x0},${y1} ${points} ${x1},${y1} `;

  // Y-axis ticks (4 ticks + 0)
  const ticks = 4;
  const tickRows = Array.from({ length: ticks + 1 }, (_, i) => {
    const t = i / ticks;
    const y = y0 + (1 - t) * height;
    const value = Math.round(t * max);
    return { y, value };
  }).reverse(); // highest first for nicer ordering

  // Number formatter - keep full numeric text (no compact notation)
  const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

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
            {numberFmt.format(tick.value)}
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

      {/* X labels rendered below SVG for readability, aligned precisely with ticks */}
      <div style={{ position: 'relative', height: '20px', marginTop: '6px' }}>
        {labels.map((lab, i) => {
          const percent = n === 1 ? 50 : (i / (n - 1)) * 100;
          let transform = 'translateX(-50%)';
          
          if (i === 0) {
            transform = 'none';
          } else if (i === labels.length - 1) {
            transform = 'translateX(-100%)';
          }
          
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${percent}%`,
                transform: transform,
                fontSize: '11px',
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {lab}
            </div>
          );
        })}
      </div>

      {/* Axis titles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'var(--muted)' }}>
        <div style={{ fontWeight: 700 }}>Sales Quantity</div>
        <div style={{ fontWeight: 700 }}>Time Period</div>
      </div>
    </div>
  );
}
