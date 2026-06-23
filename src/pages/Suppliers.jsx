import { useState } from 'react';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import Toolbar from '../components/ui/Toolbar';
import StatCard from '../components/ui/StatCard';
import { useBusinessData } from '../api/resources';
import { createSupplier, updateSupplier, deleteSupplier } from '../api/useSuppliers';
import { number } from '../utils/formatters';

export default function Suppliers() {
  const { data, loading, error, reload } = useBusinessData();

  // Search & Filter State
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view' | null
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    supplierName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (loading) return <LoadingState message="Loading suppliers..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  // Filter & Search Logic
  const filteredSuppliers = (data.suppliers || []).filter((supplier) => {
    const suppliedProducts = (data.products || []).filter((p) => p.supplierId === supplier.id);

    // Search matching
    const query = searchValue.toLowerCase().trim();
    if (query) {
      const matchesSearch =
        supplier.supplierName?.toLowerCase().includes(query) ||
        supplier.email?.toLowerCase().includes(query) ||
        supplier.phone?.toLowerCase().includes(query) ||
        supplier.address?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filter chip matching
    if (activeFilter === 'Active partnerships') {
      return suppliedProducts.length > 0;
    }
    if (activeFilter === 'No products') {
      return suppliedProducts.length === 0;
    }

    return true;
  });

  // Paginated selection
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage) || 1;
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Modal actions
  const openCreateModal = () => {
    setFormData({ supplierName: '', email: '', phone: '', address: '' });
    setFormErrors({});
    setSubmitError('');
    setModalMode('create');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedSupplier(null);
  };

  const handleEdit = (index) => {
    const supplier = paginatedSuppliers[index];
    if (!supplier) return;
    setSelectedSupplier(supplier);
    setFormData({
      supplierName: supplier.supplierName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setFormErrors({});
    setSubmitError('');
    setModalMode('edit');
  };

  const handleView = (index) => {
    const supplier = paginatedSuppliers[index];
    if (!supplier) return;
    setSelectedSupplier(supplier);
    setModalMode('view');
  };

  const handleDelete = async (index) => {
    const supplier = paginatedSuppliers[index];
    if (!supplier) return;

    if (window.confirm(`Are you sure you want to delete supplier "${supplier.supplierName}"?`)) {
      try {
        await deleteSupplier(supplier.id);
        reload();
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete supplier.');
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.supplierName.trim()) errors.supplierName = 'Supplier Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
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
      supplierName: formData.supplierName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
    };

    try {
      if (modalMode === 'create') {
        await createSupplier(payload);
      } else if (modalMode === 'edit') {
        await updateSupplier(selectedSupplier.id, payload);
      }
      reload();
      closeModal();
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to save supplier. Please try again.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const rows = paginatedSuppliers.map((supplier) => [
    supplier.supplierName,
    supplier.email,
    supplier.phone,
    String((data.products || []).filter((product) => product.supplierId === supplier.id).length),
  ]);

  const totalSuppliersCount = (data.suppliers || []).length;
  const activePartnershipsCount = (data.suppliers || []).filter((s) => (data.products || []).some((p) => p.supplierId === s.id)).length;
  const totalSuppliedItemsCount = (data.products || []).filter((p) => p.supplierId !== null && p.supplierId !== undefined).length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Procurement"
        title="Suppliers"
        description="Live supplier records from smartbiz_db."
        actions={<Button icon="plus" onClick={openCreateModal}>Add supplier</Button>}
      />

      <section className="summary-grid">
        <StatCard label="Total Suppliers" value={number(totalSuppliersCount)} growth="Live" icon="suppliers" />
        <StatCard label="Active Partnerships" value={number(activePartnershipsCount)} growth="Supplying products" icon="sales" />
        <StatCard label="Supplied Items" value={number(totalSuppliedItemsCount)} growth="Total inventory varieties" icon="products" />
      </section>

      <Toolbar
        searchPlaceholder="Search suppliers..."
        filters={['Active partnerships', 'No products']}
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
              columns={['Supplier Name', 'Email', 'Phone', 'Products Supplied']}
              rows={rows}
              actions
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
            />
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages} ({filteredSuppliers.length} suppliers)</span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
            </div>
          </>
        ) : (
          <EmptyState
            title="No suppliers yet"
            description="Supplier records from the database will appear here."
            action="Add supplier"
            onAction={openCreateModal}
          />
        )}
      </section>

      {/* CREATE & EDIT MODAL */}
      {modalMode && modalMode !== 'view' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Supplier' : 'Edit Supplier'}</h3>
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
                    <label htmlFor="supplierName">Supplier Name *</label>
                    <input
                      type="text"
                      id="supplierName"
                      className={formErrors.supplierName ? 'error' : ''}
                      value={formData.supplierName}
                      onChange={(e) => {
                        setFormData({ ...formData, supplierName: e.target.value });
                        setFormErrors({ ...formErrors, supplierName: '' });
                      }}
                      placeholder="e.g. Acme Corp"
                      required
                    />
                    {formErrors.supplierName && <span className="error-msg">{formErrors.supplierName}</span>}
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        className={formErrors.email ? 'error' : ''}
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          setFormErrors({ ...formErrors, email: '' });
                        }}
                        placeholder="e.g. supplier@example.com"
                        required
                      />
                      {formErrors.email && <span className="error-msg">{formErrors.email}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="text"
                        id="phone"
                        className={formErrors.phone ? 'error' : ''}
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          setFormErrors({ ...formErrors, phone: '' });
                        }}
                        placeholder="e.g. +94 77 123 4567"
                        required
                      />
                      {formErrors.phone && <span className="error-msg">{formErrors.phone}</span>}
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="address">Address</label>
                    <textarea
                      id="address"
                      rows="3"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. 456 Industrial Zone, Colombo"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : 'Save Supplier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {modalMode === 'view' && selectedSupplier && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Supplier Profile</h3>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '999px', background: 'var(--blue-soft)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                  {selectedSupplier.supplierName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{selectedSupplier.supplierName}</h4>
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Supplier ID: #{selectedSupplier.id}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Email</label>
                  <strong style={{ wordBreak: 'break-all' }}>{selectedSupplier.email}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Phone</label>
                  <strong>{selectedSupplier.phone}</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Address</label>
                <p style={{ margin: 0, color: 'var(--text)' }}>{selectedSupplier.address || 'No address provided'}</p>
              </div>

              {/* LIST OF PRODUCTS SUPPLIED */}
              <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Products Supplied ({(data.products || []).filter((p) => p.supplierId === selectedSupplier.id).length})
                </label>
                {(() => {
                  const suppliedProducts = (data.products || []).filter((p) => p.supplierId === selectedSupplier.id);
                  if (suppliedProducts.length > 0) {
                    return (
                      <div style={{ display: 'grid', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                        {suppliedProducts.map((p) => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--app-bg)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>
                            <span style={{ fontWeight: 600 }}>{p.productName}</span>
                            <span style={{ color: 'var(--muted)' }}>{p.category} | {number(p.stockQuantity)} units</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return <span style={{ color: 'var(--muted)', fontSize: '13px' }}>No products supplied by this supplier.</span>;
                })()}
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={closeModal}>Close</Button>
              <Button variant="primary" icon="edit" onClick={() => {
                const supplier = selectedSupplier;
                setSelectedSupplier(supplier);
                setFormData({
                  supplierName: supplier.supplierName || '',
                  email: supplier.email || '',
                  phone: supplier.phone || '',
                  address: supplier.address || '',
                });
                setFormErrors({});
                setSubmitError('');
                setModalMode('edit');
              }}>Edit Profile</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
