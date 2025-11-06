// molecules/PortBadge.jsx
import { Icon } from '../atoms/Icon';

export const PortBadge = ({ 
  portId, 
  portName, 
  variant = "main", 
  onMove = null, 
  onRemove 
}) => {
  const variants = {
    main: {
      bg: "bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/30",
      text: "text-blue-200",
      moveColor: "text-blue-300 hover:text-green-400",
      removeColor: "text-blue-300 hover:text-red-400"
    },
    endpoint: {
      bg: "bg-green-600/20 border-green-500/50 hover:bg-green-600/30",
      text: "text-green-200",
      moveColor: "text-green-300 hover:text-blue-400",
      removeColor: "text-green-300 hover:text-red-400"
    }
  };

  const style = variants[variant];

  return (
    <div className={`flex items-center gap-2 ${style.bg} border rounded-md px-3 py-2 group transition-colors`}>
      <span className={`text-sm font-medium ${style.text}`}>
        {portName || portId}
      </span>
      <div className="flex gap-1">
        {onMove && (
          <button
            type="button"
            onClick={() => onMove(portId)}
            className={`${style.moveColor} transition-colors`}
            title={variant === 'main' ? 'Pindah ke Pelabuhan Sekitar' : 'Pindah ke Pelabuhan Utama'}
          >
            {variant === 'main' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(portId)}
          className={`${style.removeColor} transition-colors`}
          title={`Hapus ${portName || portId}`}
        >
          <Icon name="close" />
        </button>
      </div>
    </div>
  );
};
