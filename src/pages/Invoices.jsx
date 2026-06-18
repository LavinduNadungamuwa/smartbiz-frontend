import { useState } from 'react';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import Toolbar from '../components/ui/Toolbar';
import { useBusinessData } from '../api/resources';
import { getSaleById, getSaleItems } from '../api/useSales';
import { currency, date, indexById, status } from '../utils/formatters';

export default function Invoices() {
  const { data, loading, error, reload } = useBusinessData();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);   // full sale object
  const [saleItems, setSaleItems] = useState([]);          // line items

  const openView = async (index) => {
    const invoice = data.invoices?.[index];
    if (!invoice) return;
    setSelectedInvoice(invoice);
    setSaleDetails(null);
    setSaleItems([]);

    if (invoice.saleId) {
      setViewLoading(true);
      try {
        const [saleRes, itemsRes] = await Promise.all([
          getSaleById(invoice.saleId),
          getSaleItems(),
        ]);
        setSaleDetails(saleRes.data);
        const allItems = Array.isArray(itemsRes.data) ? itemsRes.data : [];
        const filtered = allItems.filter(
          (item) =>
            item.saleId === invoice.saleId ||
            item.sale?.id === invoice.saleId ||
            item.sale_id === invoice.saleId
        );
        setSaleItems(filtered);
      } catch {
        // graceful — modal still shows invoice-level data
      } finally {
        setViewLoading(false);
      }
    }
  };

  const closeView = () => {
    setSelectedInvoice(null);
    setSaleDetails(null);
    setSaleItems([]);
  };

  const handlePrint = () => {
    const inv = selectedInvoice;
    const sale = saleDetails;
    const customerById = indexById(data.customers || []);
    const productById = indexById(data.products || []);
    const customerName = sale
      ? customerById[sale.customerId]?.fullName || `Customer #${sale.customerId}`
      : '—';

    const viewItems = saleItems.map((item) => {
      const productId = item.productId ?? item.product_id ?? item.product?.id ?? item.product?.productId;
      const productName =
        item.productName || item.product?.productName || item.product?.name || productById[productId]?.productName || `Product #${productId}`;
      const quantity = Number(item.quantity ?? item.qty ?? 0);
      const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0);
      const totalPrice = Number(item.totalPrice ?? item.total_price ?? item.total ?? quantity * unitPrice);
      return { productName, quantity, unitPrice, totalPrice };
    });

    const itemsHtml = viewItems.length
      ? viewItems.map(it => `
          <tr>
            <td style="padding:8px 10px">${it.productName}</td>
            <td style="padding:8px 10px;text-align:center">${it.quantity}</td>
            <td style="padding:8px 10px;text-align:right">${currency(it.unitPrice)}</td>
            <td style="padding:8px 10px;text-align:right;font-weight:700">${currency(it.totalPrice)}</td>
          </tr>`).join('')
      : `<tr><td colspan="4" style="padding:10px;color:#888">No line items available.</td></tr>`;

    const subtotal = sale?.subtotal ?? inv.totalAmount;
    const discount = sale?.discount ?? 0;
    const total = inv.totalAmount ?? sale?.totalAmount;
    const paymentMethod = sale ? status(sale.paymentMethod) : '—';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${inv.invoiceNumber || `INV-${inv.id}`}</title>
        <style>
          body { font-family: Inter, system-ui, sans-serif; color: #111; padding: 40px; font-size: 14px; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 10px; font-size: 12px; font-weight: 700;
                   background: ${inv.status === 'PAID' ? '#e0f0ff' : '#fff3e0'}; color: ${inv.status === 'PAID' ? '#0070f3' : '#e07a00'}; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          label { font-size: 11px; color: #888; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { text-align: left; padding: 8px 10px; font-size: 11px; color: #888; text-transform: uppercase; border-bottom: 2px solid #eee; }
          th:last-child, td:last-child { text-align: right; }
          th:nth-child(2), td:nth-child(2) { text-align: center; }
          td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
          tfoot td { font-size: 13px; }
          .total-row td { font-size: 15px; font-weight: 800; border-top: 2px solid #eee; }
          .footer { margin-top: 32px; font-size: 12px; color: #aaa; text-align: center; }
        </style>
      </head>
      <body>
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <h1>${inv.invoiceNumber || `INV-${inv.id}`}</h1>
            <div class="meta">Issue: ${date(inv.issueDate)} &bull; Due: ${date(inv.dueDate)}</div>
          </div>
          <div><span class="badge">${status(inv.status)}</span></div>
        </div>
        <div class="grid">
          <div><label>Customer</label><strong>${customerName}</strong></div>
          <div><label>Payment Method</label><strong>${paymentMethod}</strong></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right;color:#888">Subtotal:</td>
              <td style="text-align:right">${currency(subtotal)}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align:right;color:#e07a00">Discount:</td>
              <td style="text-align:right;color:#e07a00">− ${currency(discount)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align:right">Total Amount:</td>
              <td style="text-align:right;color:#0070f3">${currency(total)}</td>
            </tr>
          </tfoot>
        </table>
        <div class="footer">Generated by SmartBiz &bull; ${new Date().toLocaleDateString()}</div>
      </body>
      </html>`;

    const win = window.open('', '_blank', 'width=800,height=700');
    win.document.write(printContent);
    win.document.close();
    win.focus();
    win.print();
  };

  if (loading) return <LoadingState message="Loading invoices..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const customerById = indexById(data.customers || []);
  const productById = indexById(data.products || []);

  const rows = data.invoices.map((invoice) => [
    invoice.invoiceNumber || `INV-${invoice.id}`,
    `Sale #${invoice.saleId || '-'}`,
    currency(invoice.totalAmount),
    date(invoice.issueDate),
    date(invoice.dueDate),
    status(invoice.status),
  ]);

  // Normalize line items for the modal
  const viewItems = saleItems.map((item) => {
    const productId = item.productId ?? item.product_id ?? item.product?.id ?? item.product?.productId;
    const productName =
      item.productName || item.product?.productName || item.product?.name || productById[productId]?.productName || `Product #${productId}`;
    const quantity = Number(item.quantity ?? item.qty ?? 0);
    const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0);
    const totalPrice = Number(item.totalPrice ?? item.total_price ?? item.total ?? quantity * unitPrice);
    return { productName, quantity: isNaN(quantity) ? 0 : quantity, unitPrice: isNaN(unitPrice) ? 0 : unitPrice, totalPrice: isNaN(totalPrice) ? 0 : totalPrice };
  });

  return (
    <div className="page">
      <PageHeader eyebrow="Billing" title="Invoices" description="Live invoice records from smartbiz_db." />
      <Toolbar searchPlaceholder="Search invoices..." filters={['Paid', 'Pending', 'Overdue']} />
      <section className="card">
        {rows.length ? (
          <DataTable columns={['Invoice Number', 'Customer', 'Amount', 'Issue Date', 'Due Date', 'Status']} rows={rows} actions="invoice" onView={openView} />
        ) : (
          <EmptyState title="No invoices yet" description="Invoice records from the database will appear here." />
        )}
      </section>

      {/* VIEW MODAL */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={closeView}>
          <div
            className="modal-container"
            style={{ width: 'min(680px, 96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Invoice Details</h3>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>
                  Sale ID: {selectedInvoice.saleId ?? '—'}
                </div>
              </div>
              <button className="modal-close" onClick={closeView} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div
              className="modal-body"
              style={{ display: 'grid', gap: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 160px)', paddingRight: '8px' }}
            >
              {/* Invoice number + status badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id}`}</h4>
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Issue: {date(selectedInvoice.issueDate)} &bull; Due: {date(selectedInvoice.dueDate)}</span>
                </div>
                <span style={{
                  display: 'inline-block', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                  background: selectedInvoice.status === 'PAID' ? 'var(--blue-soft)' : 'var(--orange-soft)',
                  color: selectedInvoice.status === 'PAID' ? 'var(--blue)' : 'var(--orange)',
                }}>
                  {status(selectedInvoice.status)}
                </span>
              </div>

              {/* Customer + Payment Method */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Customer Name</label>
                  <strong>
                    {saleDetails
                      ? customerById[saleDetails.customerId]?.fullName || `Customer #${saleDetails.customerId}`
                      : '—'}
                  </strong>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Payment Method</label>
                  <strong>{saleDetails ? status(saleDetails.paymentMethod) : '—'}</strong>
                </div>
              </div>

              {/* Products / Line Items */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Products</label>
                {viewLoading ? (
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>Loading items…</p>
                ) : viewItems.length > 0 ? (
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
                    </table>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
                    {selectedInvoice.saleId ? 'No line items found.' : 'No linked sale — item details unavailable.'}
                  </p>
                )}
              </div>

              {/* Subtotal / Discount / Total */}
              <div style={{ background: 'var(--app-bg)', padding: '16px', borderRadius: '12px', display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                  <strong>{currency(saleDetails?.subtotal ?? selectedInvoice.totalAmount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--muted)' }}>Discount</span>
                  <span style={{ color: 'var(--orange)', fontWeight: 600 }}>− {currency(saleDetails?.discount ?? 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--blue)' }}>{currency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              {/* Notes (if present) */}
              {selectedInvoice.notes && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Notes</label>
                  <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-line' }}>{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <Button variant="ghost" onClick={closeView}>Close</Button>
              <Button variant="primary" onClick={handlePrint}>
                {/* Printer icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
