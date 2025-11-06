// molecules/TabButton.jsx
import { Icon } from '../atoms/Icon';

export const TabButton = ({ 
  active, 
  onClick, 
  icon, 
  label, 
  count = null 
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all ${
        active
          ? 'border-blue-500 text-blue-400'
          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon name={icon} />
        {label}
        {count !== null && count > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
            {count}
          </span>
        )}
        {count === 'dot' && (
          <span className="ml-1 w-2 h-2 bg-green-500 rounded-full"></span>
        )}
      </div>
    </button>
  );
};
