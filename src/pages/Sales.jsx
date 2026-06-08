import { useState } from 'react';
import { AreaChart, ChartCard } from '../components/charts';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';
import { createSale, updateSale, deleteSale } from '../api/useSales';
import { currency, date, indexById, lastMonthsSeries, number, status } from '../utils/formatters';
import useAuth from '../store/useAuth';

export default function Sales() {
  const { data, loading, error, reload } = useBusinessData();
  const { isAdmin } = useAuth();

  // Search & Filter State
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view' | null
  const [selectedSale, setSelectedSale] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceNumber: '',
    saleDate: '',
    status: 'COMPLETED',
    paymentMethod: 'CASH',
    tax: '0',
    discount: '0',
    notes: '',
    items: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (loading) return <LoadingState message="Loading sales..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const customerById = indexById(data.customers || []);
  const productById = indexById(data.products || []);

  // Filter & Search Logic
  const filteredSales = (data.sales || []).filter((sale) => {
    const customer = customerById[sale.customerId];
    const customerName = customer?.fullName || '';
    const saleItems = sale.items || sale.saleItems || [];
    const productNames = saleItems
      .map((item) => item.productName || productById[item.productId]?.productName || '')
      .join(' ');

    // Search matching
    const query = searchValue.toLowerCase().trim();
    if (query) {
      const matchesSearch =
        `sale-${sale.id}`.includes(query) ||
        sale.invoiceNumber?.toLowerCase().includes(query) ||
        customerName.toLowerCase().includes(query) ||
        productNames.toLowerCase().includes(query) ||
        sale.status?.toLowerCase().includes(query) ||
        sale.paymentMethod?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filter chip matching
    if (activeFilter === 'Completed') {
      return sale.status?.toUpperCase() === 'COMPLETED';
    }
    if (activeFilter === 'Pending') {
      return sale.status?.toUpperCase() === 'PENDING';
    }
    if (activeFilter === 'Refunded') {
      return sale.status?.toUpperCase() === 'REFUNDED';
    }

    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Modal actions
  const openCreateModal = () => {
    setFormData({
      customerId: '',
      invoiceNumber: `SALE-${Date.now().toString().slice(-6)}`,
      saleDate: new Date().toISOString().split('T')[0],
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      tax: '0',
      discount: '0',
      notes: '',
      items: [{ productId: '', quantity: 1, unitPrice: '' }],
    });
    setFormErrors({});
    setSubmitError('');
    setModalMode('create');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedSale(null);
  };

  const handleEdit = (index) => {
    const sale = paginatedSales[index];
    if (!sale) return;
    setSelectedSale(sale);
    const saleItems = sale.items || sale.saleItems || [];
    setFormData({
      customerId: sale.customerId !== undefined ? String(sale.customerId) : '',
      invoiceNumber: sale.invoiceNumber || '',
      saleDate: sale.saleDate ? new Date(sale.saleDate).toISOString().split('T')[0] : '',
      status: sale.status || 'COMPLETED',
      paymentMethod: sale.paymentMethod || 'CASH',
      tax: sale.tax !== undefined ? String(sale.tax) : '0',
      discount: sale.discount !== undefined ? String(sale.discount) : '0',
      notes: sale.notes || '',
      items: saleItems.map((item) => ({
        productId: item.productId !== undefined ? String(item.productId) : '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice !== undefined ? String(item.unitPrice) : '',
      })),
    });
    setFormErrors({});
    setSubmitError('');
    setModalMode('edit');
  };

  const handleView = (index) => {
    const sale = paginatedSales[index];
    if (!sale) return;
    setSelectedSale(sale);
    setModalMode('view');
  };

  const handleDelete = async (index) => {
    const sale = paginatedSales[index];
    if (!sale) return;

    if (!isAdmin) {
      alert('Only ADMIN users are authorized to delete sales records.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete sale "${sale.invoiceNumber || `SALE-${sale.id}`}"?`)) {
      try {
        await deleteSale(sale.id);
        reload();
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete sale.');
      }
    }
  };

  // Dynamic Item Row Handlers
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'productId') {
      const prod = productById[value];
      if (prod) {
        newItems[index].unitPrice = String(prod.unitPrice || '');
      } else {
        newItems[index].unitPrice = '';
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, unitPrice: '' }],
    });
  };

  const removeItemRow = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // Calculations
  const calculatedSubtotal = formData.items.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.unitPrice || 0);
    return sum + qty * price;
  }, 0);

  const calculatedTotal = calculatedSubtotal + Number(formData.tax || 0) - Number(formData.discount || 0);

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.customerId) errors.customerId = 'Customer is required';
    if (!formData.invoiceNumber.trim()) errors.invoiceNumber = 'Invoice Number is required';
    if (!formData.saleDate) errors.saleDate = 'Sale Date is required';

    const itemsErrors = [];
    if (formData.items.length === 0) {
      errors.itemsGlobal = 'At least one product item is required';
    } else {
      formData.items.forEach((item, index) => {
        const itemErr = {};
        if (!item.productId) itemErr.productId = 'Required';
        
        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
          itemErr.quantity = 'Must be positive integer';
        }

        const price = Number(item.unitPrice);
        if (isNaN(price) || price < 0) {
          itemErr.unitPrice = 'Must be non-negative';
        }

        if (Object.keys(itemErr).length > 0) {
          itemsErrors[index] = itemErr;
        }
      });
      if (itemsErrors.length > 0) {
        errors.items = itemsErrors;
      }
    }

    if (formData.tax === '' || isNaN(Number(formData.tax)) || Number(formData.tax) < 0) {
      errors.tax = 'Tax must be a non-negative number';
    }
    if (formData.discount === '' || isNaN(Number(formData.discount)) || Number(formData.discount) < 0) {
      errors.discount = 'Discount must be a non-negative number';
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

    const formattedItems = formData.items.map((item) => ({
      productId: parseInt(item.productId, 10),
      quantity: parseInt(item.quantity, 10),
      unitPrice: parseFloat(item.unitPrice),
      totalPrice: parseInt(item.quantity, 10) * parseFloat(item.unitPrice),
    }));

    const payload = {
      customerId: parseInt(formData.customerId, 10),
      invoiceNumber: formData.invoiceNumber.trim(),
      saleDate: formData.saleDate,
      status: formData.status.toUpperCase(),
      paymentMethod: formData.paymentMethod,
      subtotal: calculatedSubtotal,
      tax: parseFloat(formData.tax),
      discount: parseFloat(formData.discount),
      totalAmount: calculatedTotal,
      notes: formData.notes.trim(),
      items: formattedItems,
      saleItems: formattedItems, // Support both potential fields in request
    };

    try {
      if (modalMode === 'create') {
        await createSale(payload);
      } else if (modalMode === 'edit') {
        await updateSale(selectedSale.id, payload);
      }
      reload();
      closeModal();
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to save sale record. Please try again.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const salesTrend = lastMonthsSeries(data.sales || [], 'saleDate', 'totalAmount');
  const totalSales = (data.sales || []).reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);

  const rows = paginatedSales.map((sale) => {
    const saleItems = sale.items || sale.saleItems || [];
    const productNames = saleItems
      .map((item) => item.productName || productById[item.productId]?.productName)
      .filter(Boolean)
      .join(', ') || '-';

    return [
      sale.invoiceNumber || `SALE-${sale.id}`,
      customerById[sale.customerId]?.fullName || `Customer #${sale.customerId || '-'}`,
      productNames,
      currency(sale.totalAmount),
      date(sale.saleDate),
      status(sale.status),
    ];
  });

  return (
    <div className="page">
      <PageHeader
        eyebrow="Sales"
        title="Sales history"
        description="Live sales records from smartbiz_db."
        actions={<Button icon="plus" onClick={openCreateModal}>Record new sale</Button>}
      />

      <section className="summary-grid">
        <StatCard label="Total Sales Value" value={currency(totalSales)} growth="Live" icon="sales" />
        <StatCard label="Orders" value={number((data.sales || []).length)} growth="Live" icon="invoices" />
        <StatCard label="Average Sale" value={currency((data.sales || []).length ? totalSales / (data.sales || []).length : 0)} growth="Live" icon="profit" />
      </section>

      <ChartCard title="Sales Analytics" subtitle="Sales totals by month">
        <AreaChart data={salesTrend.values} />
      </ChartCard>

      <Toolbar
        searchPlaceholder="Search sales..."
        filters={['Completed', 'Pending', 'Refunded']}
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
              columns={['Invoice Number', 'Customer', 'Products', 'Total Amount', 'Date', 'Status']}
              rows={rows}
              actions
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
            />
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages} ({filteredSales.length} sales)</span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
            </div>
          </>
        ) : (
          <EmptyState
            title="No sales yet"
            description="Sales records from the database will appear here."
            action="Record sale"
            onAction={openCreateModal}
          />
        )}
      </section>

      {/* CREATE & EDIT MODAL */}
      {modalMode && modalMode !== 'view' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-container"
            style={{
              width: 'min(720px, 96vw)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
               <h3>{modalMode === 'create' ? 'Record New Sale' : 'Edit Sale Record'}</h3>
               <button className="modal-close" onClick={closeModal} aria-label="Close">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <line x1="18" y1="6" x2="6" y2="18"></line>
                   <line x1="6" y1="6" x2="18" y2="18"></line>
                 </svg>
               </button>
             </div>
            <form onSubmit={handleSubmit}>
              <div
                className="modal-body"
                style={{
                  overflowY: 'auto',
                  maxHeight: 'calc(90vh - 180px)', // leaves room for header/footer
                }}
              >
                 {submitError && (
                   <div style={{ color: 'var(--red)', background: 'var(--red-soft)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                     {submitError}
                   </div>
                 )}
                <div className="form-grid">
                  <div className="form-row-2">
                    <div className="form-field">
                      <label htmlFor="customerId">Customer *</label>
                      <select
                        id="customerId"
                        className={formErrors.customerId ? 'error' : ''}
                        value={formData.customerId}
                        onChange={(e) => {
                          setFormData({ ...formData, customerId: e.target.value });
                          setFormErrors({ ...formErrors, customerId: '' });
                        }}
                        required
                      >
                        <option value="">Select Customer</option>
                        {(data.customers || []).map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.fullName}
                          </option>
                        ))}
                      </select>
                      {formErrors.customerId && <span className="error-msg">{formErrors.customerId}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="invoiceNumber">Invoice Number *</label>
                      <input
                        type="text"
                        id="invoiceNumber"
                        className={formErrors.invoiceNumber ? 'error' : ''}
                        value={formData.invoiceNumber}
                        onChange={(e) => {
                          setFormData({ ...formData, invoiceNumber: e.target.value });
                          setFormErrors({ ...formErrors, invoiceNumber: '' });
                        }}
                        placeholder="e.g. SALE-1024"
                        required
                      />
                      {formErrors.invoiceNumber && <span className="error-msg">{formErrors.invoiceNumber}</span>}
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label htmlFor="saleDate">Sale Date *</label>
                      <input
                        type="date"
                        id="saleDate"
                        className={formErrors.saleDate ? 'error' : ''}
                        value={formData.saleDate}
                        onChange={(e) => {
                          setFormData({ ...formData, saleDate: e.target.value });
                          setFormErrors({ ...formErrors, saleDate: '' });
                        }}
                        required
                      />
                      {formErrors.saleDate && <span className="error-msg">{formErrors.saleDate}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="status">Payment Status *</label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                      >
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                        <option value="REFUNDED">Refunded</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="paymentMethod">Payment Method</label>
                    <select
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Dynamic Product Items */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontWeight: 700 }}>Products List *</h4>
                      <Button variant="ghost" icon="plus" onClick={addItemRow}>Add Product</Button>
                    </div>
                    {formErrors.itemsGlobal && (
                      <div className="error-msg" style={{ marginBottom: '12px', display: 'block' }}>{formErrors.itemsGlobal}</div>
                    )}
                    
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {formData.items.map((item, idx) => {
                        const itemErr = formErrors.items?.[idx] || {};
                        return (
                          <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--app-bg)', padding: '12px', borderRadius: '10px' }}>
                            <div style={{ flex: 3 }} className="form-field">
                              <label style={{ fontSize: '11px', color: 'var(--muted)' }}>Product</label>
                              <select
                                className={itemErr.productId ? 'error' : ''}
                                value={item.productId}
                                onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                                required
                              >
                                <option value="">Select Product</option>
                                {(data.products || []).map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.productName} ({currency(product.unitPrice)})
                                  </option>
                                ))}
                              </select>
                              {itemErr.productId && <span className="error-msg">{itemErr.productId}</span>}
                            </div>

                            <div style={{ flex: 1 }} className="form-field">
                              <label style={{ fontSize: '11px', color: 'var(--muted)' }}>Qty</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                className={itemErr.quantity ? 'error' : ''}
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                required
                              />
                              {itemErr.quantity && <span className="error-msg">{itemErr.quantity}</span>}
                            </div>

                            <div style={{ flex: 1.5 }} className="form-field">
                              <label style={{ fontSize: '11px', color: 'var(--muted)' }}>Price ($)</label>
                              <input
                                type="number"
                                min="0.00"
                                step="0.01"
                                className={itemErr.unitPrice ? 'error' : ''}
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                required
                              />
                              {itemErr.unitPrice && <span className="error-msg">{itemErr.unitPrice}</span>}
                            </div>

                            <div style={{ flex: 1.2, alignSelf: 'center', textAlign: 'right', paddingRight: '8px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Total</span>
                              <strong style={{ fontSize: '14px' }}>
                                {currency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}
                              </strong>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--red)',
                                cursor: 'pointer',
                                padding: '8px',
                                marginTop: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Remove item"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Calculations Breakdowns */}
                  <div style={{ background: 'var(--app-bg)', padding: '16px', borderRadius: '12px', marginTop: '12px', display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>Subtotal:</span>
                      <strong>{currency(calculatedSubtotal)}</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-field">
                        <label htmlFor="tax" style={{ fontSize: '12px' }}>Tax ($)</label>
                        <input
                          type="number"
                          id="tax"
                          min="0"
                          step="0.01"
                          className={formErrors.tax ? 'error' : ''}
                          value={formData.tax}
                          onChange={(e) => {
                            setFormData({ ...formData, tax: e.target.value });
                            setFormErrors({ ...formErrors, tax: '' });
                          }}
                        />
                        {formErrors.tax && <span className="error-msg">{formErrors.tax}</span>}
                      </div>

                      <div className="form-field">
                        <label htmlFor="discount" style={{ fontSize: '12px' }}>Discount ($)</label>
                        <input
                          type="number"
                          id="discount"
                          min="0"
                          step="0.01"
                          className={formErrors.discount ? 'error' : ''}
                          value={formData.discount}
                          onChange={(e) => {
                            setFormData({ ...formData, discount: e.target.value });
                            setFormErrors({ ...formErrors, discount: '' });
                          }}
                        />
                        {formErrors.discount && <span className="error-msg">{formErrors.discount}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                      <span>Total Amount:</span>
                      <span style={{ color: 'var(--blue)' }}>{currency(calculatedTotal)}</span>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      rows="2"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Enter additional details..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : 'Save Sale Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {modalMode === 'view' && selectedSale && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-container"
            style={{
              width: 'min(680px, 96vw)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
             <div className="modal-header">
               <h3>Sale Invoice Details</h3>
               <button className="modal-close" onClick={closeModal} aria-label="Close">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <line x1="18" y1="6" x2="6" y2="18"></line>
                   <line x1="6" y1="6" x2="18" y2="18"></line>
                 </svg>
               </button>
             </div>
            <div
              className="modal-body"
              style={{
                display: 'grid',
                gap: '20px',
                overflowY: 'auto',
                maxHeight: 'calc(90vh - 160px)', // leaves room for header/footer
                paddingRight: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                    {selectedSale.invoiceNumber || `SALE-${selectedSale.id}`}
                  </h4>
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Date: {date(selectedSale.saleDate)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, background: selectedSale.status === 'COMPLETED' ? 'var(--blue-soft)' : 'var(--orange-soft)', color: selectedSale.status === 'COMPLETED' ? 'var(--blue)' : 'var(--orange)' }}>
                    {status(selectedSale.status)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Customer Name</label>
                  <strong>{customerById[selectedSale.customerId]?.fullName || `Customer #${selectedSale.customerId || '-'}`}</strong>
                </div>
                 <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Payment Method</label>
                  <strong>{status(selectedSale.paymentMethod)}</strong>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Purchased Items</label>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '10px' }}>Product</th>
                        <th style={{ textAlign: 'center', padding: '10px' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '10px' }}>Unit Price</th>
                        <th style={{ textAlign: 'right', padding: '10px' }}>Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedSale.items || selectedSale.saleItems || []).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px' }}>
                            {item.productName || productById[item.productId]?.productName || `Product #${item.productId}`}
                          </td>
                          <td style={{ textAlign: 'center', padding: '10px' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right', padding: '10px' }}>{currency(item.unitPrice)}</td>
                          <td style={{ textAlign: 'right', padding: '10px' }}>{currency(item.totalPrice || (item.quantity * item.unitPrice))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div style={{ background: 'var(--app-bg)', padding: '16px', borderRadius: '12px', display: 'grid', gap: '8px', marginLeft: 'auto', width: '280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Subtotal:</span>
                  <strong>{currency(selectedSale.subtotal || (selectedSale.items || selectedSale.saleItems || []).reduce((s, i) => s + (i.quantity * i.unitPrice), 0))}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Tax:</span>
                  <strong>{currency(selectedSale.tax)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Discount:</span>
                  <strong>-{currency(selectedSale.discount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Total Paid:</span>
                  <span style={{ color: 'var(--blue)' }}>{currency(selectedSale.totalAmount)}</span>
                </div>
              </div>

              {selectedSale.notes && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Notes</label>
                  <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-line' }}>{selectedSale.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={closeModal}>Close</Button>
              <Button variant="primary" icon="edit" onClick={() => {
                const index = paginatedSales.findIndex(s => s.id === selectedSale.id);
                if (index !== -1) {
                  handleEdit(index);
                }
              }}>Edit Invoice</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

