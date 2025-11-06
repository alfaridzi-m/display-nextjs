// molecules/FormField.jsx
import { Label } from '../atoms/Label';
import { Input } from '../atoms/Input';

export const FormField = ({ 
  label, 
  id, 
  name, 
  type = "text",
  value, 
  onChange, 
  placeholder = "",
  validation = null,
  required = false,
  helpText = null,
  pattern = null,
  title = ""
}) => {
  return (
    <div>
      <Label htmlFor={id} required={required}>{label}</Label>
      <Input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        validation={validation}
        pattern={pattern}
        title={title}
      />
      {value && validation?.message && (
        <p className={`text-xs mt-1 ${validation.isValid ? 'text-green-400' : 'text-red-400'}`}>
          {validation.message}
        </p>
      )}
      {helpText && !value && (
        <div className="pl-4 mt-1">
          {Array.isArray(helpText) ? (
            helpText.map((text, idx) => (
              <li key={idx} className="text-xs text-white" dangerouslySetInnerHTML={{ __html: text }} />
            ))
          ) : (
            <p className="text-xs text-gray-400">{helpText}</p>
          )}
        </div>
      )}
    </div>
  );
};
