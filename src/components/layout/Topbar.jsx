import Icon from '../ui/Icon';
import Toggle from '../ui/Toggle';
import { useEffect, useState } from 'react';
import useAuth from '../../store/useAuth';

export default function Topbar({ onMenuClick }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('sb_theme') || 'dark');
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sb_theme', theme);
  }, [theme]);

  // Use reactive context user; fall back to localStorage for page-refresh safety
  const user = authUser || readSavedUser();
  const email = user.sub || user.email || 'smartbiz@account.com';
  const initials = email.slice(0, 2).toUpperCase();
  const businessName = user.businessName || 'SmartBiz Business';
  const businessLogo = user.businessLogo || null;

  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" type="button" onClick={onMenuClick} aria-label="Open navigation">
        <Icon name="menu" />
      </button>
      <div className="topbar-logo">
        <span className="logo-mark small">SB</span>
        <strong>SmartBiz</strong>
      </div>
      <label className="global-search">
        <Icon name="search" size={18} />
        <input type="search" placeholder="Search customers, invoices, products..." />
      </label>
      <div className="topbar-actions">
        <button className="icon-button notification-button" type="button" aria-label="Notifications">
          <Icon name="bell" />
          <span className="notification-dot" />
        </button>
        <button className="business-switcher" type="button">
          {businessName}
          <span>v</span>
        </button>
        <Toggle
          checked={theme === 'dark'}
          onChange={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          ariaLabel="Toggle dark mode"
        />
        <div className="avatar" aria-label="User profile">
          {businessLogo
            ? <img src={businessLogo} alt="Business logo" className="avatar-logo" />
            : initials}
        </div>
      </div>
    </header>
  );
}

function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('sb_user') || '{}');
  } catch {
    return {};
  }
}
