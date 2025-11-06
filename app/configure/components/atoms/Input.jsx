// atoms/Input.jsx
export const Input = ({ 
  type = "text", 
  name, 
  id, 
  value, 
  onChange, 
  placeholder = "", 
  className = "",
  validation = null,
  disabled = false,
  pattern = null,
  title = ""
}) => {
  const baseStyles = "w-full bg-gray-700 border rounded-lg p-3 focus:ring-2 focus:outline-none transition-all duration-300";
  
  const getValidationStyles = () => {
    if (!value) return 'border-gray-600 focus:ring-blue-500 focus:border-blue-500';
    if (validation?.isChecking) return 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500';
    if (validation?.isValid) return 'border-green-500 focus:ring-green-500 focus:border-green-500';
    return 'border-red-500 focus:ring-red-500 focus:border-red-500';
  };

  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        pattern={pattern}
        title={title}
        className={`${baseStyles} ${getValidationStyles()} ${className}`}
      />
      {validation && value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {validation.isChecking ? (
            <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : validation.isValid ? (
            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};
