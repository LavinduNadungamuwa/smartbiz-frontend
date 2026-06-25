export default function BarChart({ revenue, expenses, labels }) {
  // Compute a shared max so both series are on the same scale
  const allValues = [...(revenue || []), ...(expenses || [])];
  const max = Math.max(...allValues, 1);

  return (
    <div className="bar-chart-wrapper">
      <div className="bar-chart">
        {(revenue || []).map((rev, index) => {
          const exp = expenses?.[index] ?? 0;
          const revH = Math.max(4, Math.round((rev / max) * 96));
          const expH = Math.max(4, Math.round((exp / max) * 96));
          return (
            <div className="bar-group" key={index}>
              <div className="bar-sticks">
                <span
                  className="bar revenue"
                  style={{ height: `${revH}%` }}
                  title={`Revenue: ${rev}`}
                />
                <span
                  className="bar expense"
                  style={{ height: `${expH}%` }}
                  title={`Expenses: ${exp}`}
                />
              </div>
              {labels?.[index] && (
                <span className="bar-label">{labels[index]}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="bar-legend">
        <span className="legend-dot revenue" /> Revenue
        <span className="legend-dot expense" /> Expenses
      </div>
    </div>
  );
}
