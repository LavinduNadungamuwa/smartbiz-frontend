import { AreaChart, BarChart, ChartCard, HorizontalBarChart, LineChart } from '../components/charts';
import DataTable from '../components/ui/DataTable';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import { useBusinessData } from '../api/resources';
import { currency, date, indexById, lastMonthsSeries, number, percent, productStatus, status } from '../utils/formatters';

export default function Dashboard() {
  const { data, loading, error, reload } = useBusinessData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { summary, customers, products, suppliers, sales, invoices, expenses } = data;
  const revenue = lastMonthsSeries(sales, 'saleDate', 'totalAmount');
  const expenseTrend = lastMonthsSeries(expenses, 'expenseDate', 'amount');
  const customerById = indexById(customers);
  const netProfit = Number(summary.netProfit || 0);
  const totalRevenue = Number(summary.totalRevenue || 0);
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const lowStock = products.filter((product) => Number(product.stockQuantity || 0) <= 10);

  const kpis = [
    { label: 'Total Revenue', value: currency(summary.totalRevenue), growth: 'Live', icon: 'revenue' },
    { label: 'Total Expenses', value: currency(summary.totalExpenses), growth: 'Live', icon: 'expenses' },
    { label: 'Net Profit', value: currency(summary.netProfit), growth: margin >= 0 ? percent(margin) : 'Loss', trend: margin >= 0 ? 'up' : 'down', icon: 'profit' },
    { label: 'Total Customers', value: number(summary.totalCustomers), growth: 'Live', icon: 'customers' },
    { label: 'Total Products', value: number(summary.totalProducts), growth: `${lowStock.length} alerts`, trend: lowStock.length ? 'down' : 'up', icon: 'products' },
    { label: 'Total Suppliers', value: number(suppliers.length), growth: 'Live', icon: 'suppliers' },
    { label: 'Total Sales', value: number(summary.totalSales), growth: 'Live', icon: 'sales' },
    { label: 'Total Invoices', value: number(summary.totalInvoices), growth: 'Live', icon: 'invoices' },
  ];

  const healthMetrics = [
    { label: 'Profit Margin', value: percent(margin), note: 'Calculated from revenue and expenses', status: margin >= 20 ? 'good' : 'watch' },
    { label: 'Revenue Growth', value: currency(revenue.raw.at(-1)), note: 'Current month revenue', status: 'good' },
    { label: 'Expense Growth', value: currency(expenseTrend.raw.at(-1)), note: 'Current month expenses', status: 'watch' },
    { label: 'Customer Growth', value: number(customers.length), note: 'Active customer records', status: 'good' },
  ];

  const topProducts = products
    .map((product) => ({ label: product.productName, value: Math.max(5, Math.min(100, Number(product.stockQuantity || 0))) }))
    .slice(0, 5);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dashboard"
        title="Business overview"
        description="Live metrics from smartbiz_db through the SmartBiz backend."
      />

      <section className="kpi-grid">
        {kpis.map((kpi) => <StatCard key={kpi.label} trend="up" {...kpi} />)}
      </section>

      <section className="dashboard-grid three">
        <ChartCard title="Sales Performance" subtitle="Sales trend over time">
          <AreaChart data={revenue.values} labels={revenue.labels} />
        </ChartCard>
        <ChartCard title="Expense Overview" subtitle="Monthly business expenses">
          <LineChart data={expenseTrend.values} labels={expenseTrend.labels} />
        </ChartCard>
        <ChartCard title="Revenue vs Expenses" subtitle="Live sales and expense totals">
          <BarChart revenue={revenue.raw} expenses={expenseTrend.raw} labels={revenue.labels} />
        </ChartCard>
      </section>

      <section className="health-grid">
        {healthMetrics.map((metric) => (
          <article className="health-card" key={metric.label}>
            <span className={`health-dot ${metric.status}`} />
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid two">
        <section className="card">
          <div className="card-header">
            <h2>Recent Sales</h2>
          </div>
          <DataTable
            columns={['Sale ID', 'Customer', 'Amount', 'Date', 'Status']}
            rows={[...sales]
              .sort((a, b) => {
                const da = new Date(a.saleDate || 0).getTime();
                const db = new Date(b.saleDate || 0).getTime();
                return db - da || (b.id || 0) - (a.id || 0);
              })
              .slice(0, 5)
              .map((sale) => [
                `SALE-${sale.id}`,
                customerById[sale.customerId]?.fullName || `Customer #${sale.customerId || '-'}`,
                currency(sale.totalAmount),
                date(sale.saleDate),
                status(sale.status),
              ])
            }
          />
        </section>
        <section className="card">
          <div className="card-header">
            <h2>Recent Invoices</h2>
          </div>
          <DataTable
            columns={['Invoice Number', 'Sale', 'Total', 'Issue Date', 'Status']}
            rows={[...invoices]
              .sort((a, b) => {
                const da = new Date(a.issueDate || 0).getTime();
                const db = new Date(b.issueDate || 0).getTime();
                return db - da || (b.id || 0) - (a.id || 0);
              })
              .slice(0, 5)
              .map((invoice) => [
                invoice.invoiceNumber || `INV-${invoice.id}`,
                `Sale #${invoice.saleId || '-'}`,
                currency(invoice.totalAmount),
                date(invoice.issueDate),
                status(invoice.status),
              ])
            }
          />
        </section>
      </section>

      <section className="dashboard-grid three bottom">
        <section className="card">
          <div className="card-header">
            <h2>Inventory Alerts</h2>
            <p>Live stock issues requiring attention</p>
          </div>
          <div className="alert-list">
            {lowStock.slice(0, 5).map((product) => (
              <div className={`inventory-alert ${Number(product.stockQuantity || 0) <= 0 ? 'danger' : 'warning'}`} key={product.id}>
                <div>
                  <strong>{product.productName}</strong>
                  <span>{number(product.stockQuantity)} units available</span>
                </div>
                <StatusBadge>{productStatus(product.stockQuantity)}</StatusBadge>
              </div>
            ))}
            {!lowStock.length && <p className="muted-note">No low-stock products right now.</p>}
          </div>
        </section>
        <ChartCard title="Top Product Stock" subtitle="Current inventory levels">
          <HorizontalBarChart data={topProducts} />
        </ChartCard>
        <section className="card ai-card">
          <div className="ai-orb">AI</div>
          <div className="card-header">
            <h2>AI Insights</h2>
            <p>Recommendations from current database records</p>
          </div>
          <div className="insight-list">
            <p>{`Revenue currently totals ${currency(summary.totalRevenue)} with ${number(summary.totalSales)} recorded sales.`}</p>
            <p>{lowStock.length ? `${lowStock.length} products need stock attention.` : 'Inventory levels look stable.'}</p>
            <p>{invoices.some((invoice) => status(invoice.status) === 'Overdue') ? 'Overdue invoices need follow-up.' : 'No overdue invoice status found.'}</p>
            <p>{expenses.length ? `Expense records total ${currency(summary.totalExpenses)}.` : 'No expenses have been recorded yet.'}</p>
          </div>
        </section>
      </section>
    </div>
  );
}
