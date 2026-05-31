import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';
import { currency, indexById, number, productStatus } from '../utils/formatters';

export default function Products() {
  const { data, loading, error, reload } = useBusinessData();

  if (loading) return <LoadingState message="Loading products..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const supplierById = indexById(data.suppliers);
  const lowStock = data.products.filter((product) => Number(product.stockQuantity || 0) > 0 && Number(product.stockQuantity || 0) <= 10);
  const outOfStock = data.products.filter((product) => Number(product.stockQuantity || 0) <= 0);
  const rows = data.products.map((product) => [
    product.productName,
    product.category || '-',
    number(product.stockQuantity),
    currency(product.unitPrice),
    supplierById[product.supplierId]?.supplierName || `Supplier #${product.supplierId || '-'}`,
    productStatus(product.stockQuantity),
  ]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Inventory"
        title="Products"
        description="Live product and inventory records from smartbiz_db."
        actions={<Button icon="plus">Add product</Button>}
      />
      <section className="summary-grid">
        <StatCard label="In Stock" value={number(data.products.length - lowStock.length - outOfStock.length)} growth="Live" icon="products" />
        <StatCard label="Low Stock" value={number(lowStock.length)} growth="Needs review" trend="down" icon="expenses" />
        <StatCard label="Out of Stock" value={number(outOfStock.length)} growth="Needs reorder" trend="down" icon="suppliers" />
      </section>
      <Toolbar searchPlaceholder="Search products..." filters={['Category', 'Supplier', 'Stock status']} viewToggle />
      <section className="card">
        {rows.length ? (
          <DataTable columns={['Product Name', 'Category', 'Stock Quantity', 'Unit Price', 'Supplier', 'Status']} rows={rows} actions />
        ) : (
          <EmptyState title="No products yet" description="Product records from the database will appear here." action="Add product" />
        )}
      </section>
    </div>
  );
}
