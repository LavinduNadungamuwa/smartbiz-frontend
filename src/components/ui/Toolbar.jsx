import Button from './Button';
import Icon from './Icon';

export default function Toolbar({ searchPlaceholder, filters = [], primaryAction, viewToggle = false }) {
  return (
    <div className="toolbar">
      <label className="toolbar-search">
        <Icon name="search" size={17} />
        <input type="search" placeholder={searchPlaceholder} />
      </label>
      <div className="toolbar-actions">
        {filters.map((filter) => (
          <button key={filter} className="filter-chip" type="button">
            <Icon name="filter" size={15} />
            {filter}
          </button>
        ))}
        {viewToggle && (
          <div className="segmented">
            <button type="button" className="active">Table</button>
            <button type="button">Cards</button>
          </div>
        )}
        {primaryAction && <Button icon="plus">{primaryAction}</Button>}
      </div>
    </div>
  );
}
