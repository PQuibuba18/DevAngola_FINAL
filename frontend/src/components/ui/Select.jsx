
export default function Select({ label, hint, error, id, children, className='', ...props }) {
  const uid = id || label?.toLowerCase().replace(/\s+/g,'-');
  return (
    <div className="field">
      {label && <label className="field__label" htmlFor={uid}>{label}</label>}
      <select id={uid} className={`select ${className}`} {...props}>{children}</select>
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
