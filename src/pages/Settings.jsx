import { useState, useRef } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { useBusinessData } from '../api/resources';
import { number } from '../utils/formatters';
import useAuth from '../store/useAuth';

// ── helpers ────────────────────────────────────────────────────────────────

function readSavedUser() {
  try { return JSON.parse(localStorage.getItem('sb_user') || '{}'); } catch { return {}; }
}

function initials(name) {
  if (!name) return 'U';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ── sub-components ─────────────────────────────────────────────────────────

function SectionCard({ icon, title, description, children, actions }) {
  return (
    <div className="s-card">
      <div className="s-card-head">
        <div className="s-card-icon">{icon}</div>
        <div>
          <h2 className="s-card-title">{title}</h2>
          {description && <p className="s-card-desc">{description}</p>}
        </div>
        {actions && <div className="s-card-head-actions">{actions}</div>}
      </div>
      <div className="s-card-body">{children}</div>
    </div>
  );
}

function FormField({ label, children, hint }) {
  return (
    <div className="sf-field">
      <label className="sf-label">{label}</label>
      {children}
      {hint && <span className="sf-hint">{hint}</span>}
    </div>
  );
}

function SInput({ value, onChange, placeholder, type = 'text', readOnly }) {
  return (
    <input
      className="sf-input"
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
    />
  );
}

function SSelect({ value, onChange, options }) {
  return (
    <select className="sf-input sf-select" value={value} onChange={onChange}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SettingsToggle({ checked, onChange, label, description }) {
  return (
    <div className="s-toggle-row">
      <div className="s-toggle-info">
        <span className="s-toggle-label">{label}</span>
        {description && <span className="s-toggle-desc">{description}</span>}
      </div>
      <button
        className={`s-switch ${checked ? 'on' : ''}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span className="s-switch-thumb" />
      </button>
    </div>
  );
}

function StatPill({ label, value, color = 'blue' }) {
  return (
    <div className={`s-stat-pill s-stat-${color}`}>
      <span className="s-stat-label">{label}</span>
      <strong className="s-stat-value">{value}</strong>
    </div>
  );
}

function AiStatusDot({ connected }) {
  return (
    <span className={`ai-status-dot ${connected ? 'connected' : 'disconnected'}`}>
      <span className="dot-pulse" />
      {connected ? 'Connected' : 'Disconnected'}
    </span>
  );
}

// ── Main Settings page ─────────────────────────────────────────────────────

export default function Settings() {
  const { data } = useBusinessData();
  const { user: authUser, updateUser } = useAuth();
  const user = authUser || readSavedUser();
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // ── Business profile state
  const [business, setBusiness] = useState({
    logo: user.businessLogo || null,
    name: user.businessName || 'SmartBiz Solutions',
    email: user.email || user.sub || 'admin@smartbiz.lk',
    phone: '+94 77 123 4567',
    address: '42 Galle Road, Colombo 03, Sri Lanka',
    regNumber: 'PV 00127843',
  });

  // ── Account state
  const [profilePic, setProfilePic] = useState(null);

  // ── Notification toggles
  const [notifs, setNotifs] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    invoiceDueReminders: true,
    monthlyReports: false,
    customerActivity: false,
    aiInsights: true,
  });

  // ── Preferences
  const [prefs, setPrefs] = useState({
    currency: 'LKR',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Colombo',
    darkMode: document.documentElement.classList.contains('dark'),
    compactView: false,
  });

  // ── AI Settings
  const [aiStatus, setAiStatus] = useState({ connected: true, testing: false });
  const [monthlyUsed] = useState(287);
  const [monthlyLimit] = useState(500);

  // ── Handlers
  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const logoDataUrl = ev.target.result;
      setBusiness(b => ({ ...b, logo: logoDataUrl }));
      updateUser({ businessLogo: logoDataUrl });
    };
    reader.readAsDataURL(file);
  }

  function handleProfilePicChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePic(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handlePrefChange(key, value) {
    if (key === 'darkMode') {
      document.documentElement.classList.toggle('dark', value);
    }
    setPrefs(p => ({ ...p, [key]: value }));
  }

  async function handleTestConnection() {
    setAiStatus(s => ({ ...s, testing: true }));
    await new Promise(r => setTimeout(r, 1800));
    setAiStatus({ connected: true, testing: false });
  }

  function handleSaveAll() {
    // persist prefs to localStorage for persistence
    localStorage.setItem('sb_prefs', JSON.stringify(prefs));
    localStorage.setItem('sb_notifs', JSON.stringify(notifs));
    // toast-style feedback via CSS class momentarily
    const btn = document.getElementById('save-all-btn');
    if (btn) {
      btn.textContent = '✓ Saved!';
      btn.classList.add('saved');
      setTimeout(() => { btn.textContent = 'Save All Changes'; btn.classList.remove('saved'); }, 2000);
    }
  }

  const userName = user.fullName || user.sub || 'Lavindu Nadungamuwa';
  const userRole = user.role || 'OWNER';
  const usagePct = Math.round((monthlyUsed / monthlyLimit) * 100);

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Manage your business profile, account, notifications, and preferences."
      />

      <div className="settings-sections">

        {/* ── 1. BUSINESS PROFILE ─────────────────────────────────────── */}
        <SectionCard
          icon={<BriefcaseIcon />}
          title="Business Profile"
          description="Your public business information and branding"
        >
          <div className="logo-upload-row">
            <div className="logo-preview" onClick={() => logoInputRef.current?.click()}>
              {business.logo
                ? <img src={business.logo} alt="Business logo" className="logo-img" />
                : <div className="logo-placeholder"><CameraIcon /><span>Upload Logo</span></div>}
            </div>
            <div className="logo-info">
              <p className="logo-tip">Click to upload your business logo</p>
              <p className="logo-formats">PNG, JPG or SVG · Max 2 MB · Recommended 200×200 px</p>
              <button type="button" className="s-btn s-btn-ghost" onClick={() => logoInputRef.current?.click()}>
                <UploadIcon /> Change Logo
              </button>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          </div>

          <h3 className="s-edit-heading">Edit Business Details</h3>
          <div className="sf-grid-2">
            <FormField label="Business Name">
              <SInput value={business.name} onChange={e => setBusiness(b => ({ ...b, name: e.target.value }))} placeholder="Your Business Name" />
            </FormField>
            <FormField label="Business Email">
              <SInput value={business.email} onChange={e => setBusiness(b => ({ ...b, email: e.target.value }))} type="email" placeholder="email@business.com" />
            </FormField>
            <FormField label="Phone Number">
              <SInput value={business.phone} onChange={e => setBusiness(b => ({ ...b, phone: e.target.value }))} placeholder="+94 77 000 0000" />
            </FormField>
            <FormField label="Business Registration Number">
              <SInput value={business.regNumber} onChange={e => setBusiness(b => ({ ...b, regNumber: e.target.value }))} placeholder="PV 00000000" />
            </FormField>
          </div>
          <FormField label="Business Address">
            <SInput value={business.address} onChange={e => setBusiness(b => ({ ...b, address: e.target.value }))} placeholder="Street, City, Country" />
          </FormField>

          <div className="s-card-actions">
            <button
              type="button"
              className="s-btn s-btn-primary"
              onClick={() => {
                updateUser({ businessName: business.name });
                const btn = document.getElementById('biz-save-btn');
                if (btn) {
                  btn.textContent = '✓ Saved!';
                  btn.classList.add('saved');
                  setTimeout(() => { btn.textContent = 'Save Changes'; btn.classList.remove('saved'); }, 2000);
                }
              }}
              id="biz-save-btn"
            >
              <SaveIcon /> Save Changes
            </button>
          </div>
        </SectionCard>

        {/* ── 2. ACCOUNT SETTINGS ─────────────────────────────────────── */}
        <SectionCard
          icon={<UserIcon />}
          title="Account Settings"
          description="Your personal account information and security"
        >
          <div className="account-profile-row">
            <div className="account-avatar-wrap">
              <div className="account-avatar" onClick={() => fileInputRef.current?.click()}>
                {profilePic
                  ? <img src={profilePic} alt="Profile" className="avatar-img" />
                  : <span className="avatar-initials">{initials(userName)}</span>}
                <div className="avatar-overlay"><CameraIcon /></div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePicChange} />
            </div>
            <div className="account-info">
              <div className="account-name-row">
                <strong className="account-name">{userName}</strong>
                <span className={`role-badge role-${userRole.toLowerCase()}`}>{userRole}</span>
              </div>
              <span className="account-email">{user.email || user.sub || 'user@smartbiz.lk'}</span>
              <div className="account-meta">
                <span><ClockIcon /> Last login: <b>Today, 09:40 AM</b></span>
                <span><CalendarIcon /> Member since: <b>Jan 15, 2025</b></span>
              </div>
            </div>
          </div>

          <div className="s-card-actions">
            <button type="button" className="s-btn s-btn-ghost">
              <KeyIcon /> Change Password
            </button>
            <button type="button" className="s-btn s-btn-secondary">
              <EditIcon /> Edit Profile
            </button>
          </div>
        </SectionCard>

        {/* ── 3. NOTIFICATION SETTINGS ────────────────────────────────── */}
        <SectionCard
          icon={<BellIcon />}
          title="Notifications"
          description="Choose what you want to be notified about"
        >
          <div className="s-toggles-list">
            <SettingsToggle
              checked={notifs.emailNotifications}
              onChange={v => setNotifs(n => ({ ...n, emailNotifications: v }))}
              label="Email Notifications"
              description="Receive important updates and alerts via email"
            />
            <SettingsToggle
              checked={notifs.lowStockAlerts}
              onChange={v => setNotifs(n => ({ ...n, lowStockAlerts: v }))}
              label="Low Stock Alerts"
              description="Get notified when product inventory falls below threshold"
            />
            <SettingsToggle
              checked={notifs.invoiceDueReminders}
              onChange={v => setNotifs(n => ({ ...n, invoiceDueReminders: v }))}
              label="Invoice Due Reminders"
              description="Automatic reminders for upcoming and overdue invoices"
            />
            <SettingsToggle
              checked={notifs.monthlyReports}
              onChange={v => setNotifs(n => ({ ...n, monthlyReports: v }))}
              label="Monthly Business Reports"
              description="Receive a summary of your monthly business performance"
            />
            <SettingsToggle
              checked={notifs.customerActivity}
              onChange={v => setNotifs(n => ({ ...n, customerActivity: v }))}
              label="Customer Activity Alerts"
              description="Notifications about new customers and significant activity"
            />
            <SettingsToggle
              checked={notifs.aiInsights}
              onChange={v => setNotifs(n => ({ ...n, aiInsights: v }))}
              label="AI Insights Notifications"
              description="Get proactive AI-generated insights and recommendations"
            />
          </div>
        </SectionCard>

        {/* ── 4. SYSTEM PREFERENCES ───────────────────────────────────── */}
        <SectionCard
          icon={<SlidersIcon />}
          title="Preferences"
          description="Customize how SmartBiz looks and behaves"
        >
          <div className="sf-grid-2">
            <FormField label="Currency">
              <SSelect
                value={prefs.currency}
                onChange={e => handlePrefChange('currency', e.target.value)}
                options={[
                  { value: 'LKR', label: '🇱🇰 LKR – Sri Lankan Rupee' },
                  { value: 'USD', label: '🇺🇸 USD – US Dollar' },
                  { value: 'EUR', label: '🇪🇺 EUR – Euro' },
                  { value: 'GBP', label: '🇬🇧 GBP – British Pound' },
                  { value: 'INR', label: '🇮🇳 INR – Indian Rupee' },
                  { value: 'AUD', label: '🇦🇺 AUD – Australian Dollar' },
                ]}
              />
            </FormField>
            <FormField label="Language">
              <SSelect
                value={prefs.language}
                onChange={e => handlePrefChange('language', e.target.value)}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'si', label: 'සිංහල (Sinhala)' },
                  { value: 'ta', label: 'தமிழ் (Tamil)' },
                ]}
              />
            </FormField>
            <FormField label="Date Format">
              <SSelect
                value={prefs.dateFormat}
                onChange={e => handlePrefChange('dateFormat', e.target.value)}
                options={[
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
                  { value: 'D MMM YYYY', label: 'D MMM YYYY' },
                ]}
              />
            </FormField>
            <FormField label="Time Zone">
              <SSelect
                value={prefs.timezone}
                onChange={e => handlePrefChange('timezone', e.target.value)}
                options={[
                  { value: 'Asia/Colombo', label: 'Asia/Colombo (IST +05:30)' },
                  { value: 'UTC', label: 'UTC +00:00' },
                  { value: 'America/New_York', label: 'US Eastern (UTC-5)' },
                  { value: 'Europe/London', label: 'London (UTC+0/+1)' },
                  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
                  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
                ]}
              />
            </FormField>
          </div>

          <div className="s-toggles-list s-toggles-compact">
            <SettingsToggle
              checked={prefs.darkMode}
              onChange={v => handlePrefChange('darkMode', v)}
              label="Dark Mode"
              description="Switch between light and dark interface themes"
            />
            <SettingsToggle
              checked={prefs.compactView}
              onChange={v => handlePrefChange('compactView', v)}
              label="Compact View"
              description="Reduce spacing for a denser information layout"
            />
          </div>
        </SectionCard>

        {/* ── 5. AI SETTINGS ──────────────────────────────────────────── */}
        <SectionCard
          icon={<SparkleIcon />}
          title="AI Insights Configuration"
          description="Manage your AI assistant connection and usage"
        >
          <div className="ai-status-bar">
            <div className="ai-status-info">
              <div className="ai-status-row">
                <span className="ai-label">Status</span>
                <AiStatusDot connected={aiStatus.connected} />
              </div>
              <div className="ai-status-row">
                <span className="ai-label">Current Model</span>
                <span className="ai-value ai-model-badge">GPT-4o-mini</span>
              </div>
            </div>
            <div className="ai-usage-wrap">
              <div className="ai-usage-header">
                <span className="ai-label">Monthly Requests Used</span>
                <span className="ai-usage-count"><strong>{monthlyUsed}</strong> / {monthlyLimit}</span>
              </div>
              <div className="ai-usage-bar">
                <div className="ai-usage-fill" style={{ width: `${usagePct}%`, background: usagePct > 80 ? 'var(--orange)' : 'var(--blue)' }} />
              </div>
              <div className="ai-usage-footer">
                <span className="ai-remaining">
                  <span className="ai-remaining-dot" style={{ background: usagePct > 80 ? 'var(--orange)' : 'var(--green)' }} />
                  {monthlyLimit - monthlyUsed} requests remaining
                </span>
                <span className="ai-pct">{usagePct}% used</span>
              </div>
            </div>
          </div>

          <div className="s-card-actions">
            <button
              type="button"
              className={`s-btn s-btn-ghost ${aiStatus.testing ? 'loading' : ''}`}
              onClick={handleTestConnection}
              disabled={aiStatus.testing}
            >
              {aiStatus.testing ? <SpinnerIcon /> : <ZapIcon />}
              {aiStatus.testing ? 'Testing…' : 'Test Connection'}
            </button>
            <button type="button" className="s-btn s-btn-secondary" onClick={() => setAiStatus(s => ({ ...s }))}>
              <RefreshIcon /> Refresh Status
            </button>
          </div>
        </SectionCard>

        {/* ── 6. SUBSCRIPTION & USAGE ─────────────────────────────────── */}
        <SectionCard
          icon={<CrownIcon />}
          title="Subscription & Usage"
          description="Your current plan and resource consumption"
        >
          <div className="plan-hero">
            <div className="plan-badge">
              <span className="plan-tier">PRO PLAN</span>
              <span className="plan-billing">Billed monthly</span>
            </div>
            <div className="plan-price">
              <strong>LKR 2,990</strong>
              <span>/month</span>
            </div>
          </div>

          <div className="s-stats-grid">
            <StatPill label="Total Products" value={number(data.products?.length ?? 48)} color="blue" />
            <StatPill label="Total Customers" value={number(data.customers?.length ?? 134)} color="green" />
            <StatPill label="Total Invoices" value={number(data.invoices?.length ?? 312)} color="purple" />
            <StatPill label="Storage Used" value="1.4 GB" color="orange" />
          </div>

          <div className="storage-bar-wrap">
            <div className="storage-bar-header">
              <span className="ai-label">Storage Usage</span>
              <span className="ai-pct">1.4 GB of 5 GB</span>
            </div>
            <div className="ai-usage-bar">
              <div className="ai-usage-fill storage-fill" style={{ width: '28%' }} />
            </div>
          </div>

          <div className="s-card-actions">
            <button type="button" className="s-btn s-btn-primary">
              <CrownIcon /> Upgrade Plan
            </button>
            <button type="button" className="s-btn s-btn-ghost">
              <ReceiptIcon /> View Billing History
            </button>
          </div>
        </SectionCard>

      </div>

      {/* ── STICKY FOOTER ───────────────────────────────────────────────── */}
      <div className="settings-footer">
        <div className="settings-footer-inner">
          <button type="button" className="s-btn s-btn-ghost s-btn-lg">
            Cancel
          </button>
          <button
            id="save-all-btn"
            type="button"
            className="s-btn s-btn-primary s-btn-lg"
            onClick={handleSaveAll}
          >
            <SaveIcon /> Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline SVG icons (no extra dependency) ─────────────────────────────────

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M2 20h20" />
      <path d="M5 20V8l7-5 7 5v12" />
      <path d="M12 3v5" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="16" height="16" style={{ animation: 'spin 0.7s linear infinite' }}>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
