// organisms/PortsTab.jsx
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import { PortBadge } from '../molecules/PortBadge';

export const PortsTab = ({ 
  formData,
  portMapping,
  CoordinatePicker,
  handlePortClick,
  handleRemovePort,
  handleRemoveEndpoint,
  handleMoveToEndpoints,
  handleMoveToMain
}) => {
  return (
    <div className="space-y-6">
      <Card gradient="from-indigo-900/20 to-purple-900/20" borderColor="border-indigo-500/30">
        <h3 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">
          <Icon name="port" className="h-5 w-5" />
          Pilih Pelabuhan
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-900/20 border border-blue-500/40 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">Pelabuhan Utama</h4>
            <p className="text-xs text-gray-400">Menampilkan informasi cuaca lengkap untuk setiap pelabuhan</p>
          </div>
          <div className="bg-green-900/20 border border-green-500/40 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-300 mb-2">Pelabuhan Sekitar</h4>
            <p className="text-xs text-gray-400">Menampilkan informasi cuaca rangkuman</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-300 mb-4">
          Klik titik pada peta untuk memilih pelabuhan.
        </p>

        <div>
          <div className="relative w-full aspect-video rounded-md overflow-hidden">
            <CoordinatePicker
              className="absolute inset-0"
              selectedPortIds={formData.portIds || []}
              selectedPortEndPoints={formData.portEndPoints || []}
              onPortClick={handlePortClick}
              showPorts={true}
              showWilayah={false}
              zoomSnap={0.5}
              zoomDelta={0.5}
            />
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Total pelabuhan terpilih: <strong>{(formData.portIds?.length || 0) + (formData.portEndPoints?.length || 0)}</strong>
          </p>
          
          {/* Main Ports */}
          {formData.portIds && formData.portIds.length > 0 && (
            <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-600/40">
              <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center gap-2">
                <Icon name="port" className="h-5 w-5" />
                Pelabuhan Utama ({formData.portIds.length}) 
                <span className="text-xs text-gray-400">Maksimal 6 Pelabuhan Utama</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {formData.portIds.map((portId) => (
                  <PortBadge
                    key={portId}
                    portId={portId}
                    portName={portMapping[portId]}
                    variant="main"
                    onMove={handleMoveToEndpoints}
                    onRemove={handleRemovePort}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                <strong>Tip:</strong> Tekan tanda + untuk memindahkan pelabuhan ke kategori "Pelabuhan Sekitar"
              </p>
            </div>
          )}
          
          {/* Endpoint Ports */}
          {formData.portEndPoints && formData.portEndPoints.length > 0 && (
            <div className="mt-4 p-4 bg-green-900/20 rounded-lg border border-green-600/40">
              <h3 className="text-sm font-semibold text-green-200 mb-3 flex items-center gap-2">
                <Icon name="port" className="h-5 w-5" />
                Pelabuhan Sekitar ({formData.portEndPoints.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {formData.portEndPoints.map((portId) => (
                  <PortBadge
                    key={portId}
                    portId={portId}
                    portName={portMapping[portId]}
                    variant="endpoint"
                    onMove={handleMoveToMain}
                    onRemove={handleRemoveEndpoint}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                <strong>Tip:</strong> Tekan tanda ↑ untuk memindahkan pelabuhan ke kategori "Pelabuhan Utama"
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
