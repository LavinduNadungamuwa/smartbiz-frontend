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
import { createSale, updateSale, deleteSale, getSaleById, getSaleItems } from '../api/useSales';
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
    discount: '0',
    notes: '',
    items: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [viewLoading, setViewLoading] = useState(false);
  const [viewSaleItems, setViewSaleItems] = useState([]);

  if (loading) return <LoadingState message="Loading sales..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  console.log("Sales Data:", data.sales);

  const customerById = indexById(data.customers || []);
  const productById = indexById(data.products || []);

  // Filter & Search Logic
  const filteredSales = (data.sales || []).filter((sale) => {
    const customer = customerById[sale.customerId];
    const customerName = customer?.fullName || '';
    const productNames = sale.products || '';

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
    setViewSaleItems([]);
  };

  const handleEdit = async (index) => {
    const sale = paginatedSales[index];
    if (!sale) return;

    try {
      const [saleRes, itemsRes] = await Promise.all([
        getSaleById(sale.id),
        getSaleItems(),
      ]);

      const fullSale = saleRes.data;
      const allItems = Array.isArray(itemsRes.data) ? itemsRes.data : [];
      const saleItems = allItems.filter(
        (item) =>
          item.saleId === sale.id ||
          item.sale?.id === sale.id ||
          item.sale_id === sale.id
      );

      setSelectedSale(fullSale);

      setFormData({
        customerId: fullSale.customerId !== undefined ? String(fullSale.customerId) : '',
        invoiceNumber: String(fullSale.invoiceNumber || `SALE-${fullSale.id}`), // Cast to safe String
        saleDate: fullSale.saleDate ? new Date(fullSale.saleDate).toISOString().split('T')[0] : '',
        status: fullSale.status || 'COMPLETED',
        paymentMethod: fullSale.paymentMethod || 'CASH',
        discount: fullSale.discount !== undefined ? String(fullSale.discount) : '0',
        notes: fullSale.notes || '',

        items: saleItems.map((item) => {
          const productId = item.productId ?? item.product_id ?? item.product?.id ?? item.product?.productId;
          const quantity = item.quantity ?? item.qty ?? 1;
          const unitPrice = item.unitPrice ?? item.unit_price ?? item.price ?? '';

          return {
            id: item.id, // <-- CRITICAL: Maintain row entity mapping
            productId: productId !== undefined ? String(productId) : '',
            productName: item.productName || item.product?.productName || item.product?.name || productById[productId]?.productName || `Product #${productId}`,
            quantity: quantity,
            unitPrice: unitPrice !== undefined ? String(unitPrice) : '',
          };
        }),
      });

      setFormErrors({});
      setSubmitError('');
      setModalMode('edit');

    } catch (err) {
      console.error("Error fetching sale details for edit:", err);
      alert("Could not load sale items. Please try again.");
    }
  };
  const handleView = async (index) => {
    const sale = paginatedSales[index];
    if (!sale) return;
    setSelectedSale(sale);
    setViewSaleItems([]);
    setModalMode('view');
    setViewLoading(true);
    try {
      const [saleRes, itemsRes] = await Promise.all([
        getSaleById(sale.id),
        getSaleItems(),
      ]);
      setSelectedSale(saleRes.data);
      console.log('[handleView] saleRes.data:', saleRes.data);
      console.log('[handleView] initial sale from list:', sale);
      // Filter items belonging to this sale; field may be saleId or sale.id
      const allItems = Array.isArray(itemsRes.data) ? itemsRes.data : [];
      const filtered = allItems.filter(
        (item) =>
          item.saleId === sale.id ||
          item.sale?.id === sale.id ||
          item.sale_id === sale.id
      );
      setViewSaleItems(filtered);
    } catch {
      // fall back gracefully — modal stays open with basic sale info
    } finally {
      setViewLoading(false);
    }
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
    // High-level declarative update preventing object mutation
    const newItems = formData.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };

        // If the product is changed, automatically pull the database base price
        if (field === 'productId') {
          const prod = productById[value];
          updatedItem.unitPrice = prod ? String(prod.unitPrice || '') : '';
          updatedItem.productName = prod ? prod.productName : '';
        }
        return updatedItem;
      }
      return item;
    });

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

  const calculatedTotal = calculatedSubtotal - Number(formData.discount || 0);


  const validateForm = () => {
    const errors = {};
    if (!formData.customerId) errors.customerId = 'Customer is required';

    if (modalMode === 'create' && (!formData.invoiceNumber || !formData.invoiceNumber.trim())) {
      errors.invoiceNumber = 'Invoice Number is required';
    }

    if (!formData.saleDate) errors.saleDate = 'Sale Date is required';

    const itemsErrors = [];
    if (formData.items.length === 0) {
      errors.itemsGlobal = 'At least one product item is required';
    } else {
      formData.items.forEach((item, index) => {
        const itemErr = {};
        // Only require product selection when creating a sale. In edit mode we show existing products and do not ask user to re-select them.
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

    try {
      // Inside your handleSubmit function
      const formattedItems = formData.items.map((item) => {
        const qty = parseInt(item.quantity, 10);
        const price = parseFloat(item.unitPrice);

        return {
          id: item.id || undefined,
          productId: parseInt(item.productId, 10),
          quantity: parseInt(item.quantity, 10),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseInt(item.quantity, 10) * parseFloat(item.unitPrice),
          product_id: parseInt(item.productId, 10),
          subtotal: qty * price,
        };
      });

      const payload = {
        customerId: parseInt(formData.customerId, 10),
        invoiceNumber: String(formData.invoiceNumber || '').trim(), // Double protected string conversion
        saleDate: formData.saleDate,
        status: String(formData.status || 'COMPLETED').toUpperCase(),
        paymentMethod: formData.paymentMethod,
        subtotal: calculatedSubtotal,
        tax: 0,
        discount: parseFloat(formData.discount) || 0,
        totalAmount: calculatedTotal,
        notes: String(formData.notes || '').trim(),
        items: formattedItems,
        saleItems: formattedItems, // Defensive alignment matching various ORM structures
      };

      if (modalMode === 'create') {
        await createSale(payload);
      } else if (modalMode === 'edit') {
        await updateSale(selectedSale.id, payload);
      }

      reload();
      closeModal();
    } catch (err) {
      console.error("Submission pipeline failed:", err);
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
    return [
      sale.invoiceNumber || `SALE-${sale.id}`,
      customerById[sale.customerId]?.fullName || `Customer #${sale.customerId || '-'}`,
      sale.products || '-',
      currency(sale.totalAmount),
      date(sale.saleDate),
      status(sale.status),
    ];
  });

  // Normalize viewSaleItems for display in the view modal
  const viewItems = viewSaleItems.map((item) => {
    const productId = item.productId ?? item.product_id ?? item.product?.id ?? item.product?.productId;
    const productName =
      item.productName || item.product?.productName || item.product?.name || productById[productId]?.productName || `Product #${productId}`;
    const quantity = Number(item.quantity ?? item.qty ?? 0);
    const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0);
    const totalPrice = Number(item.totalPrice ?? item.total_price ?? item.total ?? quantity * unitPrice);
    return {
      productName,
      quantity: isNaN(quantity) ? 0 : quantity,
      unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
      totalPrice: isNaN(totalPrice) ? 0 : totalPrice,
    };
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
        <AreaChart labels={salesTrend.labels} values={salesTrend.raw} />
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
                  overflowX: 'hidden',
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
                      {/* Invoice: editable when creating, read-only display when editing */}
                      {modalMode === 'create' ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <label>Invoice Number</label>
                          <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--app-bg)', fontWeight: 700 }}>{formData.invoiceNumber || (selectedSale && (selectedSale.invoiceNumber || `SALE-${selectedSale.id}`))}</div>
                        </>
                      )}
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
                          <div key={idx} style={{ background: 'var(--app-bg)', padding: '12px', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {/* Product selector — full width */}
                            <div style={{ gridColumn: '1 / -1' }} className="form-field">
                              <label style={{ fontSize: '11px', color: 'var(--muted)' }}>Product</label>
                              <select
                                className={itemErr.productId ? 'error' : ''}
                                value={item.productId || ''}
                                onChange={(e) =>
                                  handleItemChange(idx, 'productId', e.target.value)
                                }
                                required
                              >
                                <option value="">Select Product</option>
                                {(data.products || []).map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.productName} ({currency(product.unitPrice)})
                                  </option>
                                ))}
                              </select>
                              {itemErr.productId && (
                                <span className="error-msg">{itemErr.productId}</span>
                              )}
                            </div>

                            {/* Qty */}
                            <div className="form-field">
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

                            {/* Unit Price */}
                            <div className="form-field">
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

                            {/* Row total + remove button */}
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                Total:&nbsp;
                                <strong style={{ color: 'var(--text)', fontSize: '14px' }}>
                                  {currency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}
                                </strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => removeItemRow(idx)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--red)',
                                  cursor: 'pointer',
                                  padding: '6px',
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
              {viewLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Loading sale details…</div>
              ) : (<>
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
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Items Ordered</label>
                  {viewItems.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Product</th>
                            <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Unit Price</th>
                            <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewItems.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px', fontWeight: 500 }}>{item.productName}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>{currency(item.unitPrice)}</td>
                              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{currency(item.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '1px solid var(--border)' }}>
                            <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right', fontSize: '14px', color: 'var(--muted)' }}>Discount:</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '14px', color: 'var(--orange)' }}>− {currency(selectedSale.discount ?? 0)}</td>
                          </tr>
                          <tr style={{ borderTop: '2px solid var(--border)' }}>
                            <td colSpan={3} style={{ padding: '10px', textAlign: 'right', fontWeight: 700, fontSize: '15px' }}>Total Amount:</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, fontSize: '15px', color: 'var(--blue)' }}>{currency(selectedSale.totalAmount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>No item details available.</p>
                  )}
                </div>

                {selectedSale.notes && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Notes</label>
                    <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-line' }}>{selectedSale.notes}</p>
                  </div>
                )}
              </>)}
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

