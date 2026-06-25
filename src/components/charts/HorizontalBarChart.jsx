export default function HorizontalBarChart({ data }) {
  return (
    <div className="horizontal-bars">
      {data.map((item) => (
        <div className="hbar-row" key={item.label}>
          <span>{item.label}</span>
          <div>
            <i style={{ width: `${item.value}%` }} />
          </div>
          <strong>{item.value}%</strong>
        </div>
      ))}
    </div>
  );
}
