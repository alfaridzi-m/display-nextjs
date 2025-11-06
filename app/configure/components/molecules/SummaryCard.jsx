// molecules/SummaryCard.jsx
export const SummaryCard = ({ 
  icon, 
  title, 
  value, 
  subtitle = null, 
  gradient = "from-blue-900/20 to-blue-800/20",
  borderColor = "border-blue-500/30",
  titleColor = "text-blue-300",
  valueColor = "text-blue-400"
}) => {
  return (
    <div className={`bg-gradient-to-r ${gradient} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className={`text-sm font-semibold ${titleColor}`}>{title}</h3>
      </div>
      {typeof value === 'object' ? (
        value
      ) : (
        <>
          <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </>
      )}
    </div>
  );
};
