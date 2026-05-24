export default function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required,
  as = 'input',
  options,
  ...props
}) {
  const inputProps = {
    className: 'form-input',
    value,
    onChange,
    placeholder,
    required,
    ...props,
  };

  return (
    <div className={`form-group ${error ? 'has-error' : ''}`}>
      {label && <label>{label}</label>}
      {as === 'select' ? (
        <select {...inputProps}>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : as === 'textarea' ? (
        <textarea {...inputProps} />
      ) : (
        <input type={type} {...inputProps} />
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
