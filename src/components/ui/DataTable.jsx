import Button from './Button';
import StatusBadge from './StatusBadge';

export default function DataTable({ columns, rows, actions = false }) {
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
          {rows.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`}>
                  {isStatusCell(cell) ? <StatusBadge>{cell}</StatusBadge> : cell}
                </td>
              ))}
              {actions && (
                <td>
                  <div className="row-actions">
                    <Button variant="ghost" icon="view">View</Button>
                    <Button variant="ghost" icon="edit">Edit</Button>
                    {actions === 'invoice' && <Button variant="ghost" icon="download">PDF</Button>}
                    {actions === 'invoice' && <Button variant="ghost" icon="print">Print</Button>}
                    {actions !== 'invoice' && <Button variant="danger" icon="trash">Delete</Button>}
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
    'Processing',
    'Refunded',
  ].includes(value);
}
