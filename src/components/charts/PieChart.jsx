import { currency } from '../../utils/formatters';

const PALETTE = [
  'var(--blue)',     // Theme Blue
  'var(--green)',    // Theme Green
  'var(--orange)',   // Theme Orange
  'var(--red)',      // Theme Red
  '#8b5cf6',         // Purple
  '#ec4899',         // Pink
  '#06b6d4',         // Cyan
  '#14b8a6',         // Teal
  '#f43f5e',         // Rose
  '#10b981',         // Emerald
  '#84cc16',         // Lime
  '#eab308',         // Yellow
  '#6366f1',         // Indigo
  '#64748b'          // Slate
];

export default function PieChart({ data = [] }) {
  // Calculate total
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

  // If total is 0, render empty/placeholder state
  if (total === 0 || data.length === 0) {
    return (
      <div className="pie-card">
        <div 
          className="pie-chart" 
          style={{ background: 'conic-gradient(var(--border) 0% 100%)' }} 
        />
        <div className="pie-legend">
          <span>
            <i style={{ backgroundColor: 'var(--muted)' }} />
            No expense data recorded
          </span>
        </div>
      </div>
    );
  }

  // Sort data descending by value to make largest slices first
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Generate color mapping and conic-gradient sectors
  let currentPercent = 0;
  const gradientSlices = [];
  const chartItems = sortedData.map((item, index) => {
    const value = Number(item.value || 0);
    const percentage = (value / total) * 100;
    const color = PALETTE[index % PALETTE.length];
    
    const start = currentPercent;
    const end = currentPercent + percentage;
    currentPercent = end;

    gradientSlices.push(`${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`);

    return {
      ...item,
      value,
      percentage,
      color,
    };
  });

  const backgroundStyle = `conic-gradient(${gradientSlices.join(', ')})`;

  return (
    <div className="pie-card">
      <div 
        className="pie-chart" 
        style={{ background: backgroundStyle }} 
      />
      <div className="pie-legend">
        {chartItems.map((item) => (
          <span key={item.label || item.name}>
            <i style={{ backgroundColor: item.color }} />
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>
              {item.label || item.name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>
              ({item.percentage.toFixed(1)}% &bull; {currency(item.value)})
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

