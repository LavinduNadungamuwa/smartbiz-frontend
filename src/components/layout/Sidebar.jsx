import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';

const navItems = [
  ['Dashboard', '/dashboard', 'dashboard'],
  ['Customers', '/customers', 'customers'],
  ['Products', '/products', 'products'],
  ['Suppliers', '/suppliers', 'suppliers'],
  ['Sales', '/sales', 'sales'],
  ['Invoices', '/invoices', 'invoices'],
  ['Expenses', '/expenses', 'expenses'],
  ['Reports', '/reports', 'reports'],
  ['AI Insights', '/ai-insights', 'ai'],
  ['Settings', '/settings', 'settings'],
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`app-sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="logo-mark">SB</div>
        <div className="brand-copy">
          <strong>SmartBiz</strong>
          <span>Business OS</span>
        </div>
        <button className="icon-button sidebar-toggle" type="button" onClick={onToggle} aria-label="Toggle sidebar">
          <Icon name="menu" size={18} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(([label, to, icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon name={icon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="nav-item logout-button" type="button">
        <Icon name="logout" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
