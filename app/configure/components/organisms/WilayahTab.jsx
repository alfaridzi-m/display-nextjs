// organisms/WilayahTab.jsx
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import { Badge } from '../atoms/Badge';

export const WilayahTab = ({ 
  formData, 
  CoordinatePicker,
  handleViewportChangeFromWilayah,
  handleWilayahClick,
  enableLabelConfig,
  setEnableLabelConfig,
  enableConnectorConfig,
  setEnableConnectorConfig,
  handleLabelPositionChange,
  handleConnectorStartChange,
  fillDummyLabelPositions,
  fillDummyConnectorPositions,
  setFormData,
  KATEGORI_GELOMBANG,
  theme
}) => {
  return (
    <div className="space-y-6">
      <Card gradient="from-cyan-900/20 to-blue-900/20" borderColor="border-cyan-500/30">
        <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center gap-2">
          <Icon name="map" className="h-6 w-6" />
          Pilih Wilayah Perairan
        </h3>
        <p className="text-sm text-white mb-4">
          Klik pada polygon wilayah di peta untuk memilih wilayah perairan yang akan ditampilkan.
        </p>
        <p className="text-base text-white mb-4">
          Ukuran tampilan peta saat ini <i>adalah <code className="bg-red-700 px-1 rounded animate-pulse">ukuran yang sama dengan tampilan akhir</code> pada layar display.</i>
        </p>

        <div>
          <div className="relative w-[1720px] h-[878px] rounded-md overflow-hidden mx-auto border-2 border-cyan-500/30">
            <CoordinatePicker
              className="absolute inset-0"
              viewPoint={
                Number.isFinite(parseFloat(formData.viewPointLat)) && Number.isFinite(parseFloat(formData.viewPointLng))
                  ? [parseFloat(formData.viewPointLat), parseFloat(formData.viewPointLng)]
                  : undefined
              }
              zoom={Number(formData.initialZoom) || undefined}
              onViewportChange={handleViewportChangeFromWilayah}
              selectedWilayahAktif={formData.wilayahAktif || []}
              onWilayahClick={handleWilayahClick}
              showPorts={false}
              zoomSnap={0.1}
              zoomDelta={0.1}
              showLabels={enableLabelConfig}
              individualPositions={formData.individualPositions || {}}
              onLabelPositionChange={handleLabelPositionChange}
              connectorStartPositions={formData.connectorStartPositions || {}}
              onConnectorStartChange={handleConnectorStartChange}
              disableMapInteraction={false}
            />
            
            {/* Wave Legend */}
            <div className="absolute z-[1000] w-64 right-4 bottom-4">
              <div className="relative bg-white/80 backdrop-blur rounded-md p-3 shadow border border-white/30 transition-all h-full flex flex-col">
                <div className={`text-base font-semibold mb-2 ${theme.text.primary} flex items-center justify-between shrink-0`}>
                  <span>Legenda Gelombang</span>
                </div>
                <ul className="space-y-2 overflow-y-auto flex-1">
                  {Object.entries(KATEGORI_GELOMBANG).filter(([k]) => k !== 'unknown').map(([category, { color, range }]) => (
                    <li key={category} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                        <span className={`${theme.text.primary} font-medium`}>{category}</span>
                      </div>
                      <span className={`${theme.text.secondary} text-right font-medium`}>{range}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 mt-3 text-center">
            <strong>Wilayah terpilih:</strong> {formData.wilayahAktif?.length || 0} wilayah • 
            <strong className="ml-2">View Point:</strong> [{formData.viewPointLat || '-'}, {formData.viewPointLng || '-'}] • 
            <strong className="ml-2">Zoom:</strong> {formData.initialZoom}
          </p>
          
          {formData.wilayahAktif?.length > 0 && (
            <div className="mt-4 p-4 bg-cyan-900/20 rounded-lg border border-cyan-600/40">
              <h3 className="text-sm font-semibold text-cyan-200 mb-3">Wilayah Aktif Terpilih</h3>
              <div className="flex flex-wrap gap-2">
                {formData.wilayahAktif.map((w) => (
                  <Badge key={w} variant="cyan">{w}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Settings Card */}
      <Card gradient="from-indigo-900/20 to-purple-900/20" borderColor="border-indigo-500/30">
        <h3 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">
          <Icon name="settings" className="h-6 w-6" />
          Pengaturan Tampilan Perairan
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Atur posisi label dan Titik garis.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <h2 className="lg:col-span-2 text-md font-semibold text-gray-300 mb-2 mt-4 lg:mt-0">
            Mengatur Posisi Label dan garis penghubung
          </h2>
          
          {/* Position Configs Side by Side */}
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Label Position Config */}
            <LabelPositionConfig
              formData={formData}
              enableLabelConfig={enableLabelConfig}
              setEnableLabelConfig={setEnableLabelConfig}
              fillDummyLabelPositions={fillDummyLabelPositions}
              setFormData={setFormData}
            />

            {/* Connector Position Config */}
            <ConnectorPositionConfig
              formData={formData}
              enableConnectorConfig={enableConnectorConfig}
              setEnableConnectorConfig={setEnableConnectorConfig}
              fillDummyConnectorPositions={fillDummyConnectorPositions}
              setFormData={setFormData}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Sub-component for Label Position Configuration
const LabelPositionConfig = ({ 
  formData, 
  enableLabelConfig, 
  setEnableLabelConfig, 
  fillDummyLabelPositions, 
  setFormData 
}) => (
  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
    <div className="flex items-center justify-between mb-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enableLabelConfig}
          onChange={(e) => setEnableLabelConfig(e.target.checked)}
          disabled={!formData.wilayahAktif || formData.wilayahAktif.length === 0}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
        />
        <span className="text-sm font-medium text-gray-300">
          Konfigurasi Posisi Label Individual
        </span>
      </label>
      {enableLabelConfig && formData.wilayahAktif?.length > 0 && (
        <button
          type="button"
          onClick={fillDummyLabelPositions}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Isi Data Contoh
        </button>
      )}
    </div>
    
    {!formData.wilayahAktif || formData.wilayahAktif.length === 0 ? (
      <p className="text-xs text-gray-500 italic">Pilih wilayah terlebih dahulu untuk mengaktifkan konfigurasi label</p>
    ) : enableLabelConfig ? (
      <div>
        <p className="text-xs text-white bg-red-900 rounded-sm mb-1 animate-pulse w-fit p-1">Drag label di map</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
          {formData.wilayahAktif.map((wilayahId) => (
            <PositionInput
              key={wilayahId}
              wilayahId={wilayahId}
              position={formData.individualPositions[wilayahId]}
              onPositionChange={(lat, lng) => setFormData(prev => ({
                ...prev,
                individualPositions: {
                  ...prev.individualPositions,
                  [wilayahId]: { lat, lng }
                }
              }))}
              onReset={() => setFormData(prev => {
                const newPositions = { ...prev.individualPositions };
                delete newPositions[wilayahId];
                return { ...prev, individualPositions: newPositions };
              })}
            />
          ))}
        </div>
      </div>
    ) : (
      <p className="text-xs text-gray-500 italic">Centang kotak di atas untuk menampilkan posisi label</p>
    )}
  </div>
);

// Sub-component for Connector Position Configuration
const ConnectorPositionConfig = ({ 
  formData, 
  enableConnectorConfig, 
  setEnableConnectorConfig, 
  fillDummyConnectorPositions, 
  setFormData 
}) => (
  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
    <div className="flex items-center justify-between mb-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enableConnectorConfig}
          onChange={(e) => setEnableConnectorConfig(e.target.checked)}
          disabled={!formData.wilayahAktif || formData.wilayahAktif.length === 0}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
        />
        <span className="text-sm font-medium text-gray-300">
          Konfigurasi Posisi Awal Konektor
        </span>
      </label>
      {enableConnectorConfig && formData.wilayahAktif?.length > 0 && (
        <button
          type="button"
          onClick={fillDummyConnectorPositions}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Isi Data Contoh
        </button>
      )}
    </div>
    
    {!formData.wilayahAktif || formData.wilayahAktif.length === 0 ? (
      <p className="text-xs text-gray-500 italic">Pilih wilayah terlebih dahulu untuk mengaktifkan konfigurasi konektor</p>
    ) : enableConnectorConfig ? (
      <div>
        <p className="text-xs text-white bg-red-900 rounded-sm mb-1 animate-pulse w-fit p-1">Drag titik di map</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
          {formData.wilayahAktif.map((wilayahId) => (
            <PositionInput
              key={wilayahId}
              wilayahId={wilayahId}
              position={formData.connectorStartPositions[wilayahId]}
              onPositionChange={(lat, lng) => setFormData(prev => ({
                ...prev,
                connectorStartPositions: {
                  ...prev.connectorStartPositions,
                  [wilayahId]: { lat, lng }
                }
              }))}
              onReset={() => setFormData(prev => {
                const newPositions = { ...prev.connectorStartPositions };
                delete newPositions[wilayahId];
                return { ...prev, connectorStartPositions: newPositions };
              })}
            />
          ))}
        </div>
      </div>
    ) : (
      <p className="text-xs text-gray-500 italic">Centang kotak di atas untuk mengaktifkan konfigurasi posisi konektor</p>
    )}
  </div>
);

// Reusable Position Input Component
const PositionInput = ({ wilayahId, position, onPositionChange, onReset }) => (
  <div className="bg-gray-700/40 border border-gray-600/50 rounded p-2 w-full max-w-[200px]">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs font-semibold text-cyan-300 truncate">{wilayahId}</span>
      <button
        type="button"
        onClick={onReset}
        className="text-[10px] text-red-400 hover:text-red-300 ml-1"
      >
        Reset
      </button>
    </div>
    <div className="space-y-1.5">
      <div>
        <label className="block text-[10px] text-gray-400 mb-0.5">Latitude</label>
        <input
          type="number"
          step="0.0001"
          value={position?.lat || ''}
          onChange={(e) => onPositionChange(Number(e.target.value), position?.lng || 0)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Auto"
        />
      </div>
      <div>
        <label className="block text-[10px] text-gray-400 mb-0.5">Longitude</label>
        <input
          type="number"
          step="0.0001"
          value={position?.lng || ''}
          onChange={(e) => onPositionChange(position?.lat || 0, Number(e.target.value))}
          className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Auto"
        />
      </div>
    </div>
  </div>
);
