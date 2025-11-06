// atoms/Badge.jsx
export const Badge = ({ 
  children, 
  variant = "default",
  className = ""
}) => {
  const variants = {
    default: "bg-gray-700/30 text-gray-200 border-gray-600/50",
    blue: "bg-blue-600/20 text-blue-200 border-blue-500/50",
    green: "bg-green-600/20 text-green-200 border-green-500/50",
    cyan: "bg-cyan-700/30 text-cyan-200 border-cyan-600/40",
    count: "px-2 py-0.5 text-xs bg-blue-600 text-white"
  };

  const baseStyles = "px-3 py-1 rounded-md text-xs border";

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
