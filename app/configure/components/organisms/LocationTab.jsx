// organisms/LocationTab.jsx
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';

export const LocationTab = ({ 
  formData, 
  CoordinatePicker,
  handleCoordinateChange 
}) => {
  return (
    <div className="space-y-6">
      <Card gradient="from-green-900/20 to-emerald-900/20" borderColor="border-green-500/30">
        <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
          <Icon name="location" className="h-6 w-6" />
          Tentukan Lokasi Anda
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          Klik pada peta untuk menentukan lokasi kantor atau stasiun Anda. Lokasi ini akan ditampilkan sebagai marker pada peta display.
        </p>

        <div>
          <div className="relative w-full aspect-video rounded-md overflow-hidden">
            <CoordinatePicker
              className="absolute inset-0"
              value={formData.yourLocation}
              onChange={handleCoordinateChange}
              showPorts={false}
              showWilayah={false}
              zoomSnap={0.5}
              zoomDelta={0.5}
            />
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            {formData.yourLocation ? (
              <span className="text-green-400">
                ✓ Lokasi terpilih: [{formData.yourLocation.lat.toFixed(5)}, {formData.yourLocation.lng.toFixed(5)}]
              </span>
            ) : (
              <span>Klik pada peta untuk menentukan lokasi Anda</span>
            )}
          </p>
        </div>
      </Card>
    </div>
  );
};
