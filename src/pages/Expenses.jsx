import { ChartCard, PieChart } from '../components/charts';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';
import { currency, date } from '../utils/formatters';

export default function Expenses() {
  const { data, loading, error, reload } = useBusinessData();

  if (loading) return <LoadingState message="Loading expenses..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const totalExpenses = data.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const categoryTotals = data.expenses.reduce((lookup, expense) => {
    lookup[expense.category || 'Uncategorized'] = (lookup[expense.category || 'Uncategorized'] || 0) + Number(expense.amount || 0);
    return lookup;
  }, {});
  const largestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  const rows = data.expenses.map((expense) => [
    expense.category || '-',
    expense.title || expense.notes || '-',
    currency(expense.amount),
    date(expense.expenseDate),
    '-',
  ]);

  return (
    <div className="page">
      <PageHeader eyebrow="Finance" title="Expenses" description="Live expense records from smartbiz_db." actions={<Button icon="plus">Add expense</Button>} />
      <section className="summary-grid">
        <StatCard label="Total Expenses" value={currency(totalExpenses)} growth="Live" trend="down" icon="expenses" />
        <StatCard label="Largest Category" value={largestCategory} growth="Live" icon="products" />
        <StatCard label="Expense Records" value={String(data.expenses.length)} growth="Live" icon="reports" />
      </section>
      <section className="dashboard-grid two">
        <ChartCard title="Expense Breakdown" subtitle="Spend distribution by category">
          <PieChart />
        </ChartCard>
        <section className="card">
          <div className="card-header">
            <h2>Expense Analytics</h2>
            <p>Category totals from the database</p>
          </div>
          <div className="metric-list">
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category}><span>{category}</span><strong>{currency(amount)}</strong></div>
            ))}
            {!Object.keys(categoryTotals).length && <p className="muted-note">No expense categories recorded yet.</p>}
          </div>
        </section>
      </section>
      <Toolbar searchPlaceholder="Search expenses..." filters={['Category', 'Payment method', 'This month']} />
      <section className="card">
        {rows.length ? (
          <DataTable columns={['Category', 'Description', 'Amount', 'Date', 'Payment Method']} rows={rows} />
        ) : (
          <EmptyState title="No expenses yet" description="Expense records from the database will appear here." action="Add expense" />
        )}
      </section>
    </div>
  );
}
