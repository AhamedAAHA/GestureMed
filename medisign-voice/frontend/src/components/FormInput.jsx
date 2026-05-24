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
  const InputTag = as === 'select' ? 'select' : as === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={`form-group ${error ? 'has-error' : ''}`}>
      {label && <label>{label}</label>}
      <InputTag
        type={as === 'input' ? type : undefined}
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        {...props}
      >
        {as === 'select' &&
          options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </InputTag>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
