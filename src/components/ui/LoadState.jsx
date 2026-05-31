import Button from './Button';

export function LoadingState({ message = 'Loading SmartBiz data...' }) {
  return (
    <div className="state-panel">
      <span className="app-spinner" />
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-panel error">
      <h2>Could not load live data</h2>
      <p>{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Retry</Button>}
    </div>
  );
}
