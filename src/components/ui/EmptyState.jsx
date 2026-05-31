import Button from './Button';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <span />
        <span />
        <span />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <Button icon="plus">{action}</Button>
    </div>
  );
}
