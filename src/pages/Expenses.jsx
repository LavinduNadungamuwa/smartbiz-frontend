import { useState } from 'react';
import { ChartCard, PieChart } from '../components/charts';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';
import { currency, date } from '../utils/formatters';
import useAuth from '../store/useAuth';
import { createExpense, updateExpense, deleteExpense } from '../api/useExpenses';

export default function Expenses() {
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
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    category: '',
    amount: '',
    expenseDate: '',
    paymentMethod: 'CASH',
  });
  const [customCategory, setCustomCategory] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (loading) return <LoadingState message="Loading expenses..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const expensesList = data.expenses || [];
  const totalExpenses = expensesList.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const categoryTotals = expensesList.reduce((lookup, expense) => {
    const cat = expense.category || 'Uncategorized';
    lookup[cat] = (lookup[cat] || 0) + Number(expense.amount || 0);
    return lookup;
  }, {});
  const largestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  const pieChartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));

  // Filter & Search Logic
  const filteredExpenses = expensesList.filter((expense) => {
    // Search matching
    const query = searchValue.toLowerCase().trim();
    if (query) {
      const matchesSearch =
        expense.category?.toLowerCase().includes(query) ||
        expense.title?.toLowerCase().includes(query) ||
        expense.notes?.toLowerCase().includes(query) ||
        expense.paymentMethod?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filter chip matching
    if (activeFilter === 'This month') {
      if (!expense.expenseDate) return false;
      const expDate = new Date(expense.expenseDate);
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    }
    if (activeFilter) {
      return expense.category?.toLowerCase() === activeFilter.toLowerCase();
    }

    return true;
  });

  // Paginated selection
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Modal actions
  const openCreateModal = () => {
    setFormData({
      title: '',
      notes: '',
      category: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
    });
    setCustomCategory('');
    setFormErrors({});
    setSubmitError('');
    setModalMode('create');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedExpense(null);
  };

  const handleEdit = (index) => {
    const expense = paginatedExpenses[index];
    if (!expense) return;
    setSelectedExpense(expense);

    const standardCategories = ['Inventory', 'Operations', 'Marketing', 'Travel', 'Software', 'Rent', 'Utilities'];
    const isStandard = standardCategories.includes(expense.category);

    setFormData({
      title: expense.title || expense.notes || '',
      notes: expense.notes || '',
      category: isStandard ? expense.category : (expense.category ? 'Other' : ''),
      amount: expense.amount !== undefined ? String(expense.amount) : '',
      expenseDate: expense.expenseDate ? expense.expenseDate.split('T')[0] : '',
      paymentMethod: expense.paymentMethod || 'CASH',
    });
    setCustomCategory(isStandard ? '' : (expense.category || ''));
    setFormErrors({});
    setSubmitError('');
    setModalMode('edit');
  };

  const handleView = (index) => {
    const expense = paginatedExpenses[index];
    if (!expense) return;
    setSelectedExpense(expense);
    setModalMode('view');
  };

  const handleDelete = async (index) => {
    const expense = paginatedExpenses[index];
    if (!expense) return;

    if (!isAdmin) {
      alert('Access Denied: Only Admins can delete expenses.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete this expense of ${currency(expense.amount)}?`)) {
      try {
        await deleteExpense(expense.id);
        reload();
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete expense.');
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Description / Title is required';
    if (!formData.category) {
      errors.category = 'Category is required';
    } else if (formData.category === 'Other' && !customCategory.trim()) {
      errors.category = 'Please specify custom category';
    }

    if (formData.amount === '' || formData.amount === undefined || formData.amount === null) {
      errors.amount = 'Amount is required';
    } else {
      const price = Number(formData.amount);
      if (isNaN(price) || price <= 0) {
        errors.amount = 'Amount must be greater than zero';
      }
    }
    if (!formData.expenseDate) errors.expenseDate = 'Date is required';
    if (!formData.paymentMethod) errors.paymentMethod = 'Payment Method is required';

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
      title: formData.title.trim(),
      notes: formData.notes.trim(),
      category: formData.category === 'Other' ? customCategory.trim() : formData.category.trim(),
      amount: parseFloat(formData.amount),
      expenseDate: `${formData.expenseDate}T00:00:00`,
      paymentMethod: formData.paymentMethod,
    };

    try {
      if (modalMode === 'create') {
        await createExpense(payload);
      } else if (modalMode === 'edit') {
        await updateExpense(selectedExpense.id, payload);
      }
      reload();
      closeModal();
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to save expense. Please try again.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const rows = paginatedExpenses.map((expense) => [
    expense.category || '-',
    expense.title || expense.notes || '-',
    currency(expense.amount),
    date(expense.expenseDate),
    expense.paymentMethod || '-',
  ]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Finance"
        title="Expenses"
        description="Live expense records from smartbiz_db."
        actions={<Button icon="plus" onClick={openCreateModal}>Add expense</Button>}
      />
      <section className="summary-grid">
        <StatCard label="Total Expenses" value={currency(totalExpenses)} growth="Live" trend="down" icon="expenses" />
        <StatCard label="Largest Category" value={largestCategory} growth="Live" icon="products" />
        <StatCard label="Expense Records" value={String(expensesList.length)} growth="Live" icon="reports" />
      </section>
      <section className="dashboard-grid two">
        <ChartCard title="Expense Breakdown" subtitle="Spend distribution by category">
          <PieChart data={pieChartData} />
        </ChartCard>
        <section className="card">
          <div className="card-header">
            <h2>Expense Analytics</h2>
            <p>Category totals from the database</p>
          </div>
          <div className="metric-list">
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category}><span>{category}</span><strong>{currency(amount)}</strong></div>
            ))}
            {!Object.keys(categoryTotals).length && <p className="muted-note">No expense categories recorded yet.</p>}
          </div>
        </section>
      </section>
      <Toolbar
        searchPlaceholder="Search expenses..."
        filters={['This month', 'Inventory', 'Operations', 'Marketing', 'Travel']}
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
              columns={['Category', 'Description', 'Amount', 'Date', 'Payment Method']}
              rows={rows}
              actions
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
            />
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages} ({filteredExpenses.length} expenses)</span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
            </div>
          </>
        ) : (
          <EmptyState
            title="No expenses yet"
            description="Expense records from the database will appear here."
            action="Add expense"
            onAction={openCreateModal}
          />
        )}
      </section>

      {/* CREATE & EDIT MODAL */}
      {modalMode && modalMode !== 'view' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Expense' : 'Edit Expense'}</h3>
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
                    <label htmlFor="title">Description / Title *</label>
                    <input
                      type="text"
                      id="title"
                      className={formErrors.title ? 'error' : ''}
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        setFormErrors({ ...formErrors, title: '' });
                      }}
                      placeholder="e.g. Office Stationery / Server hosting"
                      required
                    />
                    {formErrors.title && <span className="error-msg">{formErrors.title}</span>}
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label htmlFor="category">Category *</label>
                      <select
                        id="category"
                        className={formErrors.category ? 'error' : ''}
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({ ...formData, category: e.target.value });
                          setFormErrors({ ...formErrors, category: '' });
                        }}
                        required
                      >
                        <option value="">Select a category</option>
                        <option value="Inventory">Inventory</option>
                        <option value="Operations">Operations</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Travel">Travel</option>
                        <option value="Software">Software</option>
                        <option value="Rent">Rent</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Other">Other (Custom)</option>
                      </select>
                      {formErrors.category && <span className="error-msg">{formErrors.category}</span>}
                    </div>

                    {formData.category === 'Other' && (
                      <div className="form-field">
                        <label htmlFor="customCategory">Specify Category *</label>
                        <input
                          type="text"
                          id="customCategory"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="e.g. Consultancy"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label htmlFor="amount">Amount ($) *</label>
                      <input
                        type="number"
                        id="amount"
                        min="0.01"
                        step="0.01"
                        className={formErrors.amount ? 'error' : ''}
                        value={formData.amount}
                        onChange={(e) => {
                          setFormData({ ...formData, amount: e.target.value });
                          setFormErrors({ ...formErrors, amount: '' });
                        }}
                        placeholder="e.g. 150.00"
                        required
                      />
                      {formErrors.amount && <span className="error-msg">{formErrors.amount}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="expenseDate">Date *</label>
                      <input
                        type="date"
                        id="expenseDate"
                        className={formErrors.expenseDate ? 'error' : ''}
                        value={formData.expenseDate}
                        onChange={(e) => {
                          setFormData({ ...formData, expenseDate: e.target.value });
                          setFormErrors({ ...formErrors, expenseDate: '' });
                        }}
                        required
                      />
                      {formErrors.expenseDate && <span className="error-msg">{formErrors.expenseDate}</span>}
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="paymentMethod">Payment Method *</label>
                    <select
                      id="paymentMethod"
                      className={formErrors.paymentMethod ? 'error' : ''}
                      value={formData.paymentMethod}
                      onChange={(e) => {
                        setFormData({ ...formData, paymentMethod: e.target.value });
                        setFormErrors({ ...formErrors, paymentMethod: '' });
                      }}
                      required
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                    {formErrors.paymentMethod && <span className="error-msg">{formErrors.paymentMethod}</span>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="notes">Notes / Additional Details</label>
                    <textarea
                      id="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Enter extra details here..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={submitLoading}>
                  {submitLoading ? 'Saving...' : 'Save Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {modalMode === 'view' && selectedExpense && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Expense Details</h3>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--red-soft)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                  $
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{selectedExpense.title || selectedExpense.notes || 'Expense'}</h4>
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Expense ID: #{selectedExpense.id}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Category</label>
                  <strong>{selectedExpense.category || '-'}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Payment Method</label>
                  <strong>{selectedExpense.paymentMethod || '-'}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Expense Date</label>
                  <strong>{date(selectedExpense.expenseDate)}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Recorded At</label>
                  <strong>{date(selectedExpense.createdAt)}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Amount</label>
                  <strong style={{ color: 'var(--red)' }}>
                    {currency(selectedExpense.amount)}
                  </strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Notes</label>
                <p style={{ margin: 0, color: 'var(--text)' }}>{selectedExpense.notes || 'No extra notes.'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={closeModal}>Close</Button>
              <Button variant="primary" icon="edit" onClick={() => {
                const expense = selectedExpense;
                setSelectedExpense(expense);

                const standardCategories = ['Inventory', 'Operations', 'Marketing', 'Travel', 'Software', 'Rent', 'Utilities'];
                const isStandard = standardCategories.includes(expense.category);

                setFormData({
                  title: expense.title || expense.notes || '',
                  notes: expense.notes || '',
                  category: isStandard ? expense.category : (expense.category ? 'Other' : ''),
                  amount: expense.amount !== undefined ? String(expense.amount) : '',
                  expenseDate: expense.expenseDate ? expense.expenseDate.split('T')[0] : '',
                  paymentMethod: expense.paymentMethod || 'CASH',
                });
                setCustomCategory(isStandard ? '' : (expense.category || ''));
                setFormErrors({});
                setSubmitError('');
                setModalMode('edit');
              }}>Edit Expense</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
