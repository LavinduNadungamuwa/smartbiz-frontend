import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../styles/app.css';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className={`mobile-sidebar-scrim${mobileOpen ? ' show' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-sidebar${mobileOpen ? ' show' : ''}`}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>
      <div className="app-main">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="page-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
