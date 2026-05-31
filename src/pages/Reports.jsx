import { BarChart, ChartCard, LineChart } from '../components/charts';
import Button from '../components/ui/Button';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { useBusinessData } from '../api/resources';
import { currency, lastMonthsSeries, number } from '../utils/formatters';

const reportTypes = ['Sales Report', 'Revenue Report', 'Expense Report', 'Inventory Report', 'Customer Report'];

export default function Reports() {
  const { data, loading, error, reload } = useBusinessData();

  if (loading) return <LoadingState message="Loading reports..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const revenue = lastMonthsSeries(data.sales, 'saleDate', 'totalAmount');
  const expenses = lastMonthsSeries(data.expenses, 'expenseDate', 'amount');

  return (
    <div className="page">
      <PageHeader
        eyebrow="Reports"
        title="Reporting dashboard"
        description="Generate reports from live SmartBiz backend records."
        actions={(
          <>
            <Button variant="secondary" icon="download">Export PDF</Button>
            <Button variant="secondary" icon="download">Export Excel</Button>
            <Button icon="download">Download report</Button>
          </>
        )}
      />
      <div className="report-toolbar">
        <label>From <input type="date" defaultValue="2026-05-01" /></label>
        <label>To <input type="date" defaultValue="2026-05-31" /></label>
      </div>
      <section className="report-type-grid">
        {reportTypes.map((type) => <button key={type} type="button">{type}</button>)}
      </section>
      <section className="summary-grid">
        <StatCard label="Revenue" value={currency(data.summary.totalRevenue)} growth="Live" icon="revenue" />
        <StatCard label="Expenses" value={currency(data.summary.totalExpenses)} growth="Live" icon="expenses" />
        <StatCard label="Customers" value={number(data.summary.totalCustomers)} growth="Live" icon="customers" />
      </section>
      <section className="dashboard-grid two">
        <ChartCard title="Revenue Report" subtitle="Sales totals by month">
          <LineChart data={revenue.values} labels={revenue.labels} />
        </ChartCard>
        <ChartCard title="Revenue and Expense Report" subtitle="Comparison by month">
          <BarChart revenue={revenue.values} expenses={expenses.values} />
        </ChartCard>
      </section>
    </div>
  );
}
