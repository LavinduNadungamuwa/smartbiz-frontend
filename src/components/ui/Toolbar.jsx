import Button from './Button';
import Icon from './Icon';

export default function Toolbar({
  searchPlaceholder,
  filters = [],
  primaryAction,
  viewToggle = false,
  searchValue,
  onSearchChange,
  activeFilter,
  onFilterClick,
  onPrimaryActionClick,
}) {
  return (
    <div className="toolbar">
      <label className="toolbar-search">
        <Icon name="search" size={17} />
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </label>
      <div className="toolbar-actions">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              className={`filter-chip ${isActive ? 'active' : ''}`}
              type="button"
              onClick={() => onFilterClick?.(isActive ? null : filter)}
              style={isActive ? { borderColor: 'var(--blue)', color: 'var(--blue)', background: 'var(--blue-soft)' } : {}}
            >
              <Icon name="filter" size={15} />
              {filter}
            </button>
          );
        })}
        {viewToggle && (
          <div className="segmented">
            <button type="button" className="active">Table</button>
            <button type="button">Cards</button>
          </div>
        )}
        {primaryAction && <Button icon="plus" onClick={onPrimaryActionClick}>{primaryAction}</Button>}
      </div>
    </div>
  );
}
