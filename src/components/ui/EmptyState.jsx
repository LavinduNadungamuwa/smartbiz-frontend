import Button from './Button';

export default function EmptyState({ title, description, action, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <span />
        <span />
        <span />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <Button icon="plus" onClick={onAction}>{action}</Button> : null}
    </div>
  );
}
