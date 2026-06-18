import Button from './Button';
import StatusBadge from './StatusBadge';

export default function DataTable({ columns, rows, actions = false, onEdit, onDelete, onView, onPrint, onDownloadPDF }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.join('-')}-${index}`}>
              {row.map((cell, indexCell) => (
                <td key={`${cell}-${indexCell}`}>
                  {isStatusCell(cell) ? <StatusBadge>{cell}</StatusBadge> : cell}
                </td>
              ))}
              {actions && (
                <td>
                  <div className="row-actions">
                    <Button variant="ghost" icon="view" onClick={() => onView?.(index)}>View</Button>
                    {actions !== 'invoice' && <Button variant="ghost" icon="edit" onClick={() => onEdit?.(index)}>Edit</Button>}
                    {actions === 'invoice' && <Button variant="ghost" icon="download" onClick={() => onDownloadPDF?.(index)}>PDF</Button>}
                    {actions === 'invoice' && <Button variant="ghost" icon="print" onClick={() => onPrint?.(index)}>Print</Button>}
                    {actions !== 'invoice' && <Button variant="danger" icon="trash" onClick={() => onDelete?.(index)}>Delete</Button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isStatusCell(value) {
  return [
    'Paid',
    'Pending',
    'Overdue',
    'In Stock',
    'Low Stock',
    'Out of Stock',
    'Completed',
    'Pending',
    'Refunded',
  ].includes(value);
}
