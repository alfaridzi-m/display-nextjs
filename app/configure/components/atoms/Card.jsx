// atoms/Card.jsx
export const Card = ({ 
  children, 
  className = "", 
  gradient = "from-blue-900/20 to-cyan-900/20",
  borderColor = "border-blue-500/30"
}) => {
  return (
    <div className={`bg-gradient-to-r ${gradient} border ${borderColor} rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
};
