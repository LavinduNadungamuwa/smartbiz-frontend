import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';

export default function Customers() {
  const { data, loading, error, reload } = useBusinessData();

  if (loading) return <LoadingState message="Loading customers..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rows = data.customers.map((customer) => [
    customer.fullName,
    customer.email,
    customer.phone,
    '-',
    '-',
  ]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        description="Live customer records from smartbiz_db."
        actions={<Button icon="plus">Add customer</Button>}
      />
      <Toolbar searchPlaceholder="Search customers..." filters={['Active', 'High value', 'Recent purchase']} />
      <section className="card">
        {rows.length ? (
          <>
            <DataTable columns={['Name', 'Email', 'Phone', 'Total Purchases', 'Last Purchase']} rows={rows} actions />
            <div className="pagination"><button>Previous</button><span>{rows.length} customers</span><button>Next</button></div>
          </>
        ) : (
          <EmptyState title="No customers yet" description="Customer records from the database will appear here." action="Add customer" />
        )}
      </section>
    </div>
  );
}
