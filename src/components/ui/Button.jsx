import Icon from './Icon';

export default function Button({ children, icon, variant = 'primary', type = 'button', onClick }) {
  return (
    <button className={`app-button ${variant}`} type={type} onClick={onClick}>
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  );
}
