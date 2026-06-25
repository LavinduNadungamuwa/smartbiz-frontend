import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import useAuth from '../../store/useAuth';

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

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

      <button className="nav-item logout-button" type="button" onClick={() => setShowLogoutModal(true)}>
        <Icon name="logout" />
        <span>Logout</span>
      </button>

      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm logout</h3>
              <button className="modal-close" onClick={() => setShowLogoutModal(false)} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="modal-body">
              Are you sure you want to logout? You will be redirected to the login page.
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
              <Button onClick={handleLogoutConfirm}>Logout</Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
