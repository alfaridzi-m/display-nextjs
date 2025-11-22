// molecules/ProgressIndicator.jsx
import { Icon } from '../atoms/Icon';

export const ProgressIndicator = ({ formData }) => {
  const steps = [
    { 
      label: 'Info Dasar', 
      completed: formData.id && formData.displayTitle 
    },
    { 
      label: 'Wilayah', 
      completed: formData.wilayahAktif?.length > 0 
    },
    { 
      label: 'Lokasi', 
      completed: formData.yourLocation !== null 
    },
    { 
      label: 'Pelabuhan', 
      completed: (formData.portIds?.length > 0 || formData.portEndPoints?.length > 0) 
    }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4">
      <h3 className="text-2xl font-semibold text-blue-300 mb-3">Progress Konfigurasi</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`flex items-center gap-2 p-2 rounded ${
              step.completed 
                ? 'bg-green-900/30 border border-green-500/50' 
                : 'bg-gray-700/30 border border-gray-600/50'
            }`}
          >
            <Icon 
              name={step.completed ? 'check' : 'circle'} 
              color={step.completed ? '#4ade80' : '#6b7280'} 
            />
            <span className="text-xl">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
