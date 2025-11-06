// atoms/Label.jsx
export const Label = ({ htmlFor, children, className = "", required = false }) => {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`block text-sm font-medium text-gray-300 mb-2 ${className}`}
    >
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
};
