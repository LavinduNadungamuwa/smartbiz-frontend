export default function PieChart() {
  return (
    <div className="pie-card">
      <div className="pie-chart" />
      <div className="pie-legend">
        <span><i className="blue" />Inventory</span>
        <span><i className="green" />Operations</span>
        <span><i className="orange" />Marketing</span>
        <span><i className="red" />Travel</span>
      </div>
    </div>
  );
}
