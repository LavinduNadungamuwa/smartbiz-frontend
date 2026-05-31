import Button from '../components/ui/Button';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import PageHeader from '../components/ui/PageHeader';
import Toggle from '../components/ui/Toggle';
import { useBusinessData } from '../api/resources';
import { number } from '../utils/formatters';

export default function Settings() {
  const { data, loading, error, reload } = useBusinessData();
  const user = readSavedUser();

  if (loading) return <LoadingState message="Loading settings..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="page">
      <PageHeader eyebrow="Workspace" title="Settings" description="Live workspace context from your SmartBiz account and database." actions={<Button>Save changes</Button>} />
      <section className="settings-grid">
        <section className="card settings-card">
          <h2>Business Settings</h2>
          <Field label="Business Name" value={`Business #${user.businessId || '-'}`} />
          <Field label="Email" value={user.sub || user.email || ''} />
          <Field label="Phone" value="" />
          <Field label="Address" value="" />
        </section>
        <section className="card settings-card">
          <h2>Account Settings</h2>
          <Field label="Profile" value={user.fullName || user.sub || user.email || 'SmartBiz User'} />
          <Field label="Password" value="Managed by SmartBiz backend authentication" />
          <Field label="Security" value="JWT protected session" />
        </section>
        <section className="card settings-card">
          <h2>Subscription Settings</h2>
          <div className="plan-card">
            <span>Current Workspace</span>
            <strong>{number(data.customers.length)} customers</strong>
            <p>{`${number(data.products.length)} products, ${number(data.suppliers.length)} suppliers, and ${number(data.invoices.length)} invoices are currently stored.`}</p>
            <Button icon="plus">Upgrade plan</Button>
          </div>
        </section>
        <section className="card settings-card">
          <h2>Notification Settings</h2>
          <Toggle label="Email notifications" />
          <Toggle label="Low stock alerts" />
          <Toggle label="Invoice reminders" />
        </section>
      </section>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input defaultValue={value} />
    </label>
  );
}

function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('sb_user') || '{}');
  } catch {
    return {};
  }
}
