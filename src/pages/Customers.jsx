import { useState } from 'react';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';
import { createCustomer, updateCustomer, deleteCustomer } from '../api/useCustomers';
import { currency, date } from '../utils/formatters';

export default function Customers() {
  const { data, loading, error, reload } = useBusinessData();
  
  // Search & Filter State
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view' | null
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (loading) return <LoadingState message="Loading customers..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  // Helper: Compute Sales analytics for a customer
  const getCustomerStats = (customerId) => {
    const customerSales = (data.sales || []).filter((s) => s.customerId === customerId);
    const totalPurchases = customerSales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
    const sorted = [...customerSales].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
    const lastPurchase = sorted.length ? date(sorted[0].saleDate) : '-';
    return { totalPurchases, lastPurchase, salesCount: customerSales.length };
  };

  // Filter & Search Logic
  const filteredCustomers = (data.customers || []).filter((customer) => {
    const stats = getCustomerStats(customer.id);
    
    // Search matching
    const query = searchValue.toLowerCase().trim();
    if (query) {
      const matchesSearch = 
        customer.fullName?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        customer.address?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filter chip matching
    if (activeFilter === 'Active') {
      return stats.salesCount > 0;
    }
    if (activeFilter === 'High value') {
      return stats.totalPurchases >= 500;
    }
    if (activeFilter === 'Recent purchase') {
      if (stats.lastPurchase === '-') return false;
      const lastDate = new Date(stats.lastPurchase);
      const diffTime = Math.abs(new Date() - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }

    return true;
  });

  // Paginated selection
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Modal actions
  const openCreateModal = () => {
    setFormData({ fullName: '', email: '', phone: '', address: '' });
    setFormErrors({});
    setSubmitError('');
    setModalMode('create');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCustomer(null);
  };

  const handleEdit = (index) => {
    const customer = paginatedCustomers[index];
    if (!customer) return;
    setSelectedCustomer(customer);
    setFormData({
      fullName: customer.fullName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setFormErrors({});
    setSubmitError('');
    setModalMode('edit');
  };

  const handleView = (index) => {
    const customer = paginatedCustomers[index];
    if (!customer) return;
    setSelectedCustomer(customer);
    setModalMode('view');
  };

  const handleDelete = async (index) => {
    const customer = paginatedCustomers[index];
    if (!customer) return;

    if (window.confirm(`Are you sure you want to delete customer "${customer.fullName}"?`)) {
      try {
        await deleteCustomer(customer.id);
        reload();
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete customer.');
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
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

    try {
      if (modalMode === 'create') {
        await createCustomer(formData);
      } else if (modalMode === 'edit') {
        await updateCustomer(selectedCustomer.id, formData);
      }
      reload();
      closeModal();
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to save customer. Please try again.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const rows = paginatedCustomers.map((customer) => {
    const stats = getCustomerStats(customer.id);
    return [
      customer.fullName,
      customer.email,
      customer.phone,
      currency(stats.totalPurchases),
      stats.lastPurchase,
    ];
  });

  return (
    <div className="page">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        description="Live customer records from smartbiz_db."
        actions={<Button icon="plus" onClick={openCreateModal}>Add customer</Button>}
      />
      <Toolbar
        searchPlaceholder="Search customers..."
        filters={['Active', 'High value', 'Recent purchase']}
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
              columns={['Name', 'Email', 'Phone', 'Total Purchases', 'Last Purchase']}
              rows={rows}
              actions
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
            />
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages} ({filteredCustomers.length} customers)</span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
            </div>
          </>
        ) : (
          <EmptyState
            title="No customers yet"
            description="Customer records from the database will appear here."
            action="Add customer"
            onAction={openCreateModal}
          />
        )}
      </section>

      {/* CREATE & EDIT MODAL */}
      {modalMode && modalMode !== 'view' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Customer' : 'Edit Customer'}</h3>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
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
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      className={formErrors.fullName ? 'error' : ''}
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        setFormErrors({ ...formErrors, fullName: '' });
                      }}
                      placeholder="e.g. John Doe"
                      required
                    />
                    {formErrors.fullName && <span className="error-msg">{formErrors.fullName}</span>}
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
                        placeholder="e.g. john@example.com"
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
                      placeholder="e.g. 123 Main St, Colombo"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : 'Save Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {modalMode === 'view' && selectedCustomer && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customer Profile</h3>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '999px', background: 'var(--blue-soft)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                  {selectedCustomer.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{selectedCustomer.fullName}</h4>
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Customer ID: #{selectedCustomer.id}</span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Email</label>
                  <strong style={{ wordBreak: 'break-all' }}>{selectedCustomer.email}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Phone</label>
                  <strong>{selectedCustomer.phone}</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Address</label>
                <p style={{ margin: 0, color: 'var(--text)' }}>{selectedCustomer.address || 'No address provided'}</p>
              </div>

              <div style={{ background: 'var(--app-bg)', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Total Purchases</label>
                  <strong style={{ fontSize: '18px', color: 'var(--blue)' }}>{currency(getCustomerStats(selectedCustomer.id).totalPurchases)}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Last Purchase</label>
                  <strong style={{ fontSize: '18px' }}>{getCustomerStats(selectedCustomer.id).lastPurchase}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={closeModal}>Close</Button>
              <Button variant="primary" icon="edit" onClick={() => {
                const customer = selectedCustomer;
                setSelectedCustomer(customer);
                setFormData({
                  fullName: customer.fullName || '',
                  email: customer.email || '',
                  phone: customer.phone || '',
                  address: customer.address || '',
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
