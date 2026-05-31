import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';
import { currency, date, status } from '../utils/formatters';

export default function Invoices() {
  const { data, loading, error, reload } = useBusinessData();

  if (loading) return <LoadingState message="Loading invoices..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rows = data.invoices.map((invoice) => [
    invoice.invoiceNumber || `INV-${invoice.id}`,
    `Sale #${invoice.saleId || '-'}`,
    currency(invoice.totalAmount),
    date(invoice.issueDate),
    date(invoice.dueDate),
    status(invoice.status),
  ]);

  return (
    <div className="page">
      <PageHeader eyebrow="Billing" title="Invoices" description="Live invoice records from smartbiz_db." actions={<Button icon="plus">Create invoice</Button>} />
      <Toolbar searchPlaceholder="Search invoices..." filters={['Paid', 'Pending', 'Overdue']} />
      <section className="card">
        {rows.length ? (
          <DataTable columns={['Invoice Number', 'Customer', 'Amount', 'Issue Date', 'Due Date', 'Status']} rows={rows} actions="invoice" />
        ) : (
          <EmptyState title="No invoices yet" description="Invoice records from the database will appear here." action="Create invoice" />
        )}
      </section>
    </div>
  );
}
