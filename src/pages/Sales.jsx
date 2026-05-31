import { AreaChart, ChartCard } from '../components/charts';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';
import { currency, date, indexById, lastMonthsSeries, number, status } from '../utils/formatters';

export default function Sales() {
  const { data, loading, error, reload } = useBusinessData();

  if (loading) return <LoadingState message="Loading sales..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const customerById = indexById(data.customers);
  const salesTrend = lastMonthsSeries(data.sales, 'saleDate', 'totalAmount');
  const totalSales = data.sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const rows = data.sales.map((sale) => [
    `SALE-${sale.id}`,
    customerById[sale.customerId]?.fullName || `Customer #${sale.customerId || '-'}`,
    '-',
    currency(sale.totalAmount),
    date(sale.saleDate),
    status(sale.status),
  ]);

  return (
    <div className="page">
      <PageHeader eyebrow="Sales" title="Sales history" description="Live sales records from smartbiz_db." actions={<Button icon="plus">Record new sale</Button>} />
      <section className="summary-grid">
        <StatCard label="Total Sales Value" value={currency(totalSales)} growth="Live" icon="sales" />
        <StatCard label="Orders" value={number(data.sales.length)} growth="Live" icon="invoices" />
        <StatCard label="Average Sale" value={currency(data.sales.length ? totalSales / data.sales.length : 0)} growth="Live" icon="profit" />
      </section>
      <ChartCard title="Sales Analytics" subtitle="Sales totals by month">
        <AreaChart data={salesTrend.values} />
      </ChartCard>
      <Toolbar searchPlaceholder="Search sales..." filters={['Completed', 'Processing', 'Refunded']} />
      <section className="card">
        {rows.length ? (
          <DataTable columns={['Sale ID', 'Customer', 'Products', 'Total Amount', 'Date', 'Status']} rows={rows} actions />
        ) : (
          <EmptyState title="No sales yet" description="Sales records from the database will appear here." action="Record sale" />
        )}
      </section>
    </div>
  );
}
