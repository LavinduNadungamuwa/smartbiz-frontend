import { useState } from 'react';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';
import { createProduct, updateProduct, deleteProduct } from '../api/useProducts';
import { currency, indexById, number, productStatus } from '../utils/formatters';

export default function Products() {
  const { data, loading, error, reload } = useBusinessData();

  // Search & Filter State
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view' | null
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    stockQuantity: '',
    unitPrice: '',
    supplierId: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (loading) return <LoadingState message="Loading products..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const supplierById = indexById(data.suppliers || []);

  // Filter & Search Logic
  const filteredProducts = (data.products || []).filter((product) => {
    // Search matching
    const query = searchValue.toLowerCase().trim();
    if (query) {
      const supplierName = supplierById[product.supplierId]?.supplierName || '';
      const matchesSearch =
        product.productName?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        supplierName.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filter chip matching
    if (activeFilter === 'In stock') {
      return Number(product.stockQuantity || 0) > 10;
    }
    if (activeFilter === 'Low stock') {
      return Number(product.stockQuantity || 0) > 0 && Number(product.stockQuantity || 0) <= 10;
    }
    if (activeFilter === 'Out of stock') {
      return Number(product.stockQuantity || 0) <= 0;
    }

    return true;
  });

  // Paginated selection
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Modal actions
  const openCreateModal = () => {
    setFormData({ productName: '', category: '', stockQuantity: '', unitPrice: '', supplierId: '' });
    setFormErrors({});
    setSubmitError('');
    setModalMode('create');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedProduct(null);
  };

  const handleEdit = (index) => {
    const product = paginatedProducts[index];
    if (!product) return;
    setSelectedProduct(product);
    setFormData({
      productName: product.productName || '',
      category: product.category || '',
      stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : '',
      unitPrice: product.unitPrice !== undefined ? String(product.unitPrice) : '',
      supplierId: product.supplierId !== undefined ? String(product.supplierId) : '',
    });
    setFormErrors({});
    setSubmitError('');
    setModalMode('edit');
  };

  const handleView = (index) => {
    const product = paginatedProducts[index];
    if (!product) return;
    setSelectedProduct(product);
    setModalMode('view');
  };

  const handleDelete = async (index) => {
    const product = paginatedProducts[index];
    if (!product) return;

    if (window.confirm(`Are you sure you want to delete product "${product.productName}"?`)) {
      try {
        await deleteProduct(product.id);
        reload();
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete product.');
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.productName.trim()) errors.productName = 'Product Name is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    
    if (formData.stockQuantity === '' || formData.stockQuantity === undefined || formData.stockQuantity === null) {
      errors.stockQuantity = 'Stock Quantity is required';
    } else {
      const stock = Number(formData.stockQuantity);
      if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
        errors.stockQuantity = 'Stock Quantity must be a non-negative integer';
      }
    }

    if (formData.unitPrice === '' || formData.unitPrice === undefined || formData.unitPrice === null) {
      errors.unitPrice = 'Unit Price is required';
    } else {
      const price = Number(formData.unitPrice);
      if (isNaN(price) || price <= 0) {
        errors.unitPrice = 'Unit Price must be greater than zero';
      }
    }

    if (!formData.supplierId) {
      errors.supplierId = 'Supplier is required';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');

    const payload = {
      productName: formData.productName.trim(),
      category: formData.category.trim(),
      stockQuantity: parseInt(formData.stockQuantity, 10),
      unitPrice: parseFloat(formData.unitPrice),
      supplierId: parseInt(formData.supplierId, 10),
    };

    try {
      if (modalMode === 'create') {
        await createProduct(payload);
      } else if (modalMode === 'edit') {
        await updateProduct(selectedProduct.id, payload);
      }
      reload();
      closeModal();
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to save product. Please try again.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const rows = paginatedProducts.map((product) => [
    product.productName,
    product.category || '-',
    number(product.stockQuantity),
    currency(product.unitPrice),
    supplierById[product.supplierId]?.supplierName || `Supplier #${product.supplierId || '-'}`,
    productStatus(product.stockQuantity),
  ]);

  const lowStockProductsCount = (data.products || []).filter((product) => Number(product.stockQuantity || 0) > 0 && Number(product.stockQuantity || 0) <= 10).length;
  const outOfStockProductsCount = (data.products || []).filter((product) => Number(product.stockQuantity || 0) <= 0).length;
  const inStockProductsCount = (data.products || []).length - lowStockProductsCount - outOfStockProductsCount;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Inventory"
        title="Products"
        description="Live product and inventory records from smartbiz_db."
        actions={<Button icon="plus" onClick={openCreateModal}>Add product</Button>}
      />
      
      <section className="summary-grid">
        <StatCard label="In Stock" value={number(inStockProductsCount)} growth="Live" icon="products" />
        <StatCard label="Low Stock" value={number(lowStockProductsCount)} growth="Needs review" trend="down" icon="expenses" />
        <StatCard label="Out of Stock" value={number(outOfStockProductsCount)} growth="Needs reorder" trend="down" icon="suppliers" />
      </section>

      <Toolbar
        searchPlaceholder="Search products..."
        filters={['In stock', 'Low stock', 'Out of stock']}
        searchValue={searchValue}
        onSearchChange={(val) => {
          setSearchValue(val);
          setCurrentPage(1);
        }}
        activeFilter={activeFilter}
        onFilterClick={(filter) => {
          setActiveFilter(filter);
          setCurrentPage(1);
        }}
      />

      <section className="card">
        {rows.length ? (
          <>
            <DataTable
              columns={['Product Name', 'Category', 'Stock Quantity', 'Unit Price', 'Supplier', 'Status']}
              rows={rows}
              actions
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
            />
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages} ({filteredProducts.length} products)</span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
            </div>
          </>
        ) : (
          <EmptyState
            title="No products yet"
            description="Product records from the database will appear here."
            action="Add product"
            onAction={openCreateModal}
          />
        )}
      </section>

      {/* CREATE & EDIT MODAL */}
      {modalMode && modalMode !== 'view' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Product' : 'Edit Product'}</h3>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {submitError && (
                  <div style={{ color: 'var(--red)', background: 'var(--red-soft)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {submitError}
                  </div>
                )}
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="productName">Product Name *</label>
                    <input
                      type="text"
                      id="productName"
                      className={formErrors.productName ? 'error' : ''}
                      value={formData.productName}
                      onChange={(e) => {
                        setFormData({ ...formData, productName: e.target.value });
                        setFormErrors({ ...formErrors, productName: '' });
                      }}
                      placeholder="e.g. Wireless Mouse"
                      required
                    />
                    {formErrors.productName && <span className="error-msg">{formErrors.productName}</span>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="category">Category *</label>
                    <input
                      type="text"
                      id="category"
                      className={formErrors.category ? 'error' : ''}
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value });
                        setFormErrors({ ...formErrors, category: '' });
                      }}
                      placeholder="e.g. Electronics"
                      required
                    />
                    {formErrors.category && <span className="error-msg">{formErrors.category}</span>}
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label htmlFor="stockQuantity">Stock Quantity *</label>
                      <input
                        type="number"
                        id="stockQuantity"
                        min="0"
                        step="1"
                        className={formErrors.stockQuantity ? 'error' : ''}
                        value={formData.stockQuantity}
                        onChange={(e) => {
                          setFormData({ ...formData, stockQuantity: e.target.value });
                          setFormErrors({ ...formErrors, stockQuantity: '' });
                        }}
                        placeholder="e.g. 50"
                        required
                      />
                      {formErrors.stockQuantity && <span className="error-msg">{formErrors.stockQuantity}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="unitPrice">Unit Price ($) *</label>
                      <input
                        type="number"
                        id="unitPrice"
                        min="0.01"
                        step="0.01"
                        className={formErrors.unitPrice ? 'error' : ''}
                        value={formData.unitPrice}
                        onChange={(e) => {
                          setFormData({ ...formData, unitPrice: e.target.value });
                          setFormErrors({ ...formErrors, unitPrice: '' });
                        }}
                        placeholder="e.g. 29.99"
                        required
                      />
                      {formErrors.unitPrice && <span className="error-msg">{formErrors.unitPrice}</span>}
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="supplierId">Supplier *</label>
                    <select
                      id="supplierId"
                      className={formErrors.supplierId ? 'error' : ''}
                      value={formData.supplierId}
                      onChange={(e) => {
                        setFormData({ ...formData, supplierId: e.target.value });
                        setFormErrors({ ...formErrors, supplierId: '' });
                      }}
                      required
                    >
                      <option value="">Select a supplier</option>
                      {(data.suppliers || []).map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.supplierName}
                        </option>
                      ))}
                    </select>
                    {formErrors.supplierId && <span className="error-msg">{formErrors.supplierId}</span>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : 'Save Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {modalMode === 'view' && selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Product Details</h3>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--blue-soft)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                  {selectedProduct.productName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{selectedProduct.productName}</h4>
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Product ID: #{selectedProduct.id}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Category</label>
                  <strong>{selectedProduct.category || '-'}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Supplier</label>
                  <strong>{supplierById[selectedProduct.supplierId]?.supplierName || `Supplier #${selectedProduct.supplierId || '-'}`}</strong>
                </div>
              </div>

              <div style={{ background: 'var(--app-bg)', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Unit Price</label>
                  <strong style={{ fontSize: '18px', color: 'var(--blue)' }}>{currency(selectedProduct.unitPrice)}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Stock Quantity</label>
                  <strong style={{ fontSize: '18px' }}>{number(selectedProduct.stockQuantity)} units</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={closeModal}>Close</Button>
              <Button variant="primary" icon="edit" onClick={() => {
                const product = selectedProduct;
                setSelectedProduct(product);
                setFormData({
                  productName: product.productName || '',
                  category: product.category || '',
                  stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : '',
                  unitPrice: product.unitPrice !== undefined ? String(product.unitPrice) : '',
                  supplierId: product.supplierId !== undefined ? String(product.supplierId) : '',
                });
                setFormErrors({});
                setSubmitError('');
                setModalMode('edit');
              }}>Edit Product</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
