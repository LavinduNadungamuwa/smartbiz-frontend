export default function BarChart({ revenue, expenses }) {
  return (
    <div className="bar-chart">
      {revenue.map((value, index) => (
        <div className="bar-group" key={`${value}-${index}`}>
          <span className="bar revenue" style={{ height: `${value}%` }} />
          <span className="bar expense" style={{ height: `${expenses[index]}%` }} />
        </div>
      ))}
    </div>
  );
}
