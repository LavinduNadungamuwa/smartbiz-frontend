import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';

export default function Suppliers() {
  const { data, loading, error, reload } = useBusinessData();

  if (loading) return <LoadingState message="Loading suppliers..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rows = data.suppliers.map((supplier) => [
    supplier.supplierName,
    supplier.email,
    supplier.phone,
    String(data.products.filter((product) => product.supplierId === supplier.id).length),
  ]);

  return (
    <div className="page">
      <PageHeader eyebrow="Procurement" title="Suppliers" description="Live supplier records from smartbiz_db." actions={<Button icon="plus">Add supplier</Button>} />
      <Toolbar searchPlaceholder="Search suppliers..." filters={['Top suppliers', 'Recently contacted']} />
      <section className="card">
        {rows.length ? (
          <DataTable columns={['Supplier Name', 'Email', 'Phone', 'Products Supplied']} rows={rows} actions />
        ) : (
          <EmptyState title="No suppliers yet" description="Supplier records from the database will appear here." action="Add supplier" />
        )}
      </section>
    </div>
  );
}
