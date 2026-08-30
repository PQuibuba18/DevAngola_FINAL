
export default function Input({ label, hint, error, id, className='', ...props }) {
  const uid = id || label?.toLowerCase().replace(/\s+/g,'-');
  return (
    <div className="field">
      {label && <label className="field__label" htmlFor={uid}>{label}</label>}
      <input id={uid} className={`input${error?' input--error':''} ${className}`} {...props} />
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
