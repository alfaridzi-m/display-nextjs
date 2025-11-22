// app/configure/page.js
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import WeatherPage from '../components/weatherpage';
import PortPage from '../components/portpage';
import Clock from '../components/clock';
import Sidebar from '../components/side-bar';
import RunningText from '../components/running-text';
import { lightTheme, darkTheme } from '../components/theme';
import PerairanPage from '../components/perairan';
import PetaPage from '../components/petaPage';
import TopBar from '../components/top-bar';
import { ToastContainer } from '../components/toast';
import { useToast } from '../hooks/useToast';
import { useConfigForm } from './hooks/useConfigForm';

// Import atomic design components
import {
  Button,
  Icon,
  TabButton,
  ProgressIndicator,
  BasicInfoTab,
  WilayahTab,
  LocationTab,
  PortsTab,
  BackgroundTab,
  ConfigSummary,
  ActionButtons
} from './components';

// Dynamically import the map component
const CoordinatePicker = dynamic(() => import("../components/CoordinatePicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-gray-700 animate-pulse rounded-md flex items-center justify-center">
      <p>Memuat peta...</p>
    </div>
  ),
});

const KATEGORI_GELOMBANG = {
  Tenang: { color: "#2793f2", range: "0 - 0.5 m" },
  Rendah: { color: "#00d342", range: "0.5 - 1.25 m" },
  Sedang: { color: "#fff200", range: "1.25 - 2.5 m" },
  Tinggi: { color: "#fd8436", range: "2.5 - 4.0 m" },
  'Sangat Tinggi': { color: "#fb0510", range: "4.0 - 6.0 m" },
  Ekstrem: { color: "#ef38ce", range: "6.0 - 9.0 m" },
  'Sangat Ekstrem': { color: "#000000", range: "> 9.0 m"},
  unknown: { color: "#c1d4e3aa", range: "N/A" }
};

export default function ConfigurePage() {
  const router = useRouter();
  const { toasts, removeToast, toast } = useToast();
  const { formData, setFormData, idValidation, portMapping, configObject, handlers } = useConfigForm(toast);
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState('weather');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [enableLabelConfig, setEnableLabelConfig] = useState(false);
  const [enableConnectorConfig, setEnableConnectorConfig] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [showConfigList, setShowConfigList] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadConfigId, setLoadConfigId] = useState("");
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  const theme = isDarkMode ? darkTheme : lightTheme;
  const pages = ['weather', 'cities', 'Perairan', 'Peta'];
  const pageDurations = {
    weather: 1500000 * (formData.portIds?.length || 1),
    cities: 300000,
    Perairan: 1500000,
    Peta: 6000000,
  };

  const configJson = useMemo(() => JSON.stringify(configObject, null, 2), [configObject]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Konfigurasi:", configObject);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(configJson).then(
        () => toast.success("Konfigurasi disalin ke clipboard!"),
        () => toast.warning("Gagal menyalin ke clipboard, tetapi data ada di console.")
      );
    } else {
      toast.info("Konfigurasi ditampilkan di console log.");
    }
  };

  const handleSaveToAPI = async () => {
    if (!configObject.id) {
      toast.error("ID Konfigurasi harus diisi!");
      return;
    }

    if (!idValidation.isValid) {
      toast.error("ID Konfigurasi tidak valid. " + idValidation.message);
      return;
    }

    try {
      const checkResponse = await fetch(`/api/configure?id=${configObject.id}`);
      const checkData = await checkResponse.json();
      
      if (checkData.success) {
        toast.warning(`ID "${configObject.id}" sudah digunakan. Silakan pilih ID lain.`);
        return;
      }
      
      const response = await fetch('/api/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configObject),
      });

      const result = await response.json();
    
      if (result.success) {
        try {
          localStorage.setItem('infometId', configObject.id);
        } catch (storageError) {
          console.warn('Failed to save config ID to localStorage:', storageError);
        }
        toast.success('Konfigurasi berhasil disimpan!');
        setTimeout(() => router.push('/infomet'), 1500);
      } else {
        toast.error(`Gagal menyimpan: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Terjadi kesalahan saat menyimpan konfigurasi');
    }
  };

  const handleUpdateToAPI = async () => {
    if (!configObject.id) {
      toast.error("ID Konfigurasi harus diisi!");
      return;
    }

    try {
      const checkResponse = await fetch(`/api/configure?id=${configObject.id}`);
      const checkData = await checkResponse.json();
      
      if (!checkData.success) {
        toast.warning(`ID "${configObject.id}" tidak ditemukan. Gunakan "Simpan ke Server" untuk membuat konfigurasi baru.`);
        return;
      }
      
      const confirmUpdate = confirm(`Apakah Anda yakin ingin memperbarui konfigurasi "${configObject.id}"?`);
      if (!confirmUpdate) return;
      
      const response = await fetch('/api/configure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configObject),
      });

      const result = await response.json();
    
      if (result.success) {
        toast.success('Konfigurasi berhasil diperbarui!');
      } else {
        toast.error(`Gagal memperbarui: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Terjadi kesalahan saat memperbarui konfigurasi');
    }
  };

  const handleLoadFromAPI = async () => {
    if (!loadConfigId.trim()) {
      toast.error("ID Konfigurasi tidak boleh kosong!");
      return;
    }

    setIsLoadingConfig(true);
    try {
      const response = await fetch(`/api/configure?id=${loadConfigId.trim()}`);
      const result = await response.json();

      if (result.success && result.data) {
        const config = result.data;
        setFormData({
          id: config.id || "",
          displayTitle: config.displayTitle || "",
          viewPointLat: config.map_settings?.view_point?.[0]?.toString() || "",
          viewPointLng: config.map_settings?.view_point?.[1]?.toString() || "",
          initialZoom: config.map_settings?.initial_zoom || 8,
          yourLocation: config.map_settings?.your_location 
            ? { lat: config.map_settings.your_location[0], lng: config.map_settings.your_location[1] }
            : null,
          portIds: config.ports?.portIds || [],
          portEndPoints: config.ports?.portEndPoints || [],
          wilayahAktif: config.wilayah_aktif || [],
          labelPosition: config.perairan_settings?.label_position || "center",
          individualPositions: config.perairan_settings?.individual_positions || {},
          connectorStartPositions: config.perairan_settings?.connector_start_positions || {},
          legendPosition: config.perairan_settings?.legend_position || { bottom: 8, right: 8 },
          legendSize: config.perairan_settings?.legend_size || { width: "auto", height: "auto" },
        });
        setShowLoadModal(false);
        setLoadConfigId("");
        toast.success("Konfigurasi berhasil dimuat!");
      } else {
        toast.error(`Konfigurasi tidak ditemukan: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast.error('Terjadi kesalahan saat memuat konfigurasi');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleLoadAllConfigs = async () => {
    try {
      const response = await fetch('/api/configure');
      const result = await response.json();

      if (result.success) {
        setSavedConfigs(result.data);
        setShowConfigList(true);
        toast.success('Daftar konfigurasi berhasil dimuat!');
      } else {
        toast.error(`Gagal memuat daftar konfigurasi: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Terjadi kesalahan saat memuat daftar konfigurasi');
    }
  };

  const handleSelectConfig = (config) => {
    setFormData({
      id: config.id || "",
      displayTitle: config.displayTitle || "",
      viewPointLat: config.map_settings?.view_point?.[0]?.toString() || "",
      viewPointLng: config.map_settings?.view_point?.[1]?.toString() || "",
      initialZoom: config.map_settings?.initial_zoom || 8,
      yourLocation: config.map_settings?.your_location 
        ? { lat: config.map_settings.your_location[0], lng: config.map_settings.your_location[1] }
        : null,
      portIds: config.ports?.portIds || [],
      portEndPoints: config.ports?.portEndPoints || [],
      wilayahAktif: config.wilayah_aktif || [],
      labelPosition: config.perairan_settings?.label_position || "center",
      individualPositions: config.perairan_settings?.individual_positions || {},
      connectorStartPositions: config.perairan_settings?.connector_start_positions || {},
      legendPosition: config.perairan_settings?.legend_position || { bottom: 8, right: 8 },
      legendSize: config.perairan_settings?.legend_size || { width: "auto", height: "auto" },
    });
    setShowConfigList(false);
    toast.success(`Konfigurasi "${config.displayTitle || config.id}" berhasil dimuat!`);
  };

  const handleDownload = () => {
    const blob = new Blob([configJson], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.id || "config"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preview mode rendering
  if (showPreview) {
    return (
      <>
        <div 
          className="min-h-screen flex flex-col md:flex-row font-sans relative overflow-hidden dark bg-cover bg-center"
          style={{ backgroundImage: `url(${theme.background.image})` }}
        >
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full filter blur-3xl opacity-70 animate-blob bg-blue-400"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-4000 bg-purple-400"></div>

          <button
            onClick={() => setShowPreview(false)}
            className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Icon name="close" />
            Keluar Preview
          </button>

          <Sidebar activePage={previewPage} handleNavClick={setPreviewPage} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} pageDurations={pageDurations} />
          <TopBar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} title={configObject.displayTitle || 'Display Preview'} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 pt-20 md:pt-15 lg:pt-18 overflow-y-auto z-10">
            <div>
              <div style={{ display: previewPage === 'weather' ? 'block' : 'none' }}>
                <WeatherPage theme={theme} list={configObject.ports.portIds} />
              </div>
              <div style={{ display: previewPage === 'cities' ? 'block' : 'none' }}>
                <PortPage theme={theme} portEndPoints={configObject.ports.portEndPoints}/>
              </div>
              <div style={{ display: previewPage === 'Perairan' ? 'block' : 'none' }}>
                <PerairanPage 
                  theme={theme} 
                  isActive={previewPage === 'Perairan'}
                  wilayahAktif={configObject.wilayah_aktif}
                  viewPoint={configObject.map_settings.view_point}
                  initialZoom={configObject.map_settings.initial_zoom}
                  yourLocation={configObject.map_settings.your_location}
                  labelPosition={configObject.perairan_settings?.label_position}
                  individualPositions={configObject.perairan_settings?.individual_positions}
                  connectorStartPositions={configObject.perairan_settings?.connector_start_positions}
                />
              </div>
              <div style={{ display: previewPage === 'Peta' ? 'block' : 'none' }}>
                <PetaPage theme={theme} />
              </div>
            </div>
          </main>
          <Clock theme={theme} isDarkMode={isDarkMode}/>
          <RunningText theme={theme} />
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-[1900px] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Pengaturan Tampilan
          </h1>
          <p className="text-gray-400 mt-2">
            Atur informasi yang akan ditampilkan pada display cuaca.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/config-select')}
              icon={<Icon name="arrowLeft" />}
            >
              Kembali
            </Button>
            <div className="relative group">
              <Button
                variant="primary"
                onClick={() => setShowLoadModal(true)}
                icon={<Icon name="upload" />}
                className="border border-cyan-500/30"
              >
                Load ID
              </Button>
              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-800 border border-cyan-500/30 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="text-xs text-gray-300">Untuk memuat konfigurasi yang sudah disimpan sebelumnya.</p>
              </div>
            </div>
          </div>
        </header>

        {/* Load Config Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Muat Konfigurasi
                </h2>
                <button
                  onClick={() => {
                    setShowLoadModal(false);
                    setLoadConfigId("");
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Icon name="close" className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="loadConfigId" className="block text-sm font-medium text-gray-300 mb-2">
                    ID Konfigurasi
                  </label>
                  <input
                    type="text"
                    id="loadConfigId"
                    value={loadConfigId}
                    onChange={(e) => setLoadConfigId(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLoadFromAPI();
                      }
                    }}
                    placeholder="Masukkan ID konfigurasi..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Masukkan ID konfigurasi yang ingin dimuat dari server
                  </p>
                </div>

                <div className="flex gap-3 pt-2 w-fit">
                  <Button
                    variant="primary"
                    onClick={handleLoadFromAPI}
                    icon={isLoadingConfig ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : <Icon name="upload" />}
                    className="flex-1"
                    disabled={isLoadingConfig}
                  >
                    {isLoadingConfig ? "Memuat..." : "Muat"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Config List Modal */}
        {showConfigList && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-white/10 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Daftar Konfigurasi Tersimpan
                </h2>
                <button
                  onClick={() => setShowConfigList(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Icon name="close" className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {savedConfigs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Belum ada konfigurasi tersimpan</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedConfigs.map((config) => (
                      <div
                        key={config.id}
                        className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition-all cursor-pointer"
                        onClick={() => handleSelectConfig(config)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-blue-300">{config.id}</h3>
                          <span className="text-xs text-gray-400">
                            {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString('id-ID') : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">{config.displayTitle || 'Tanpa nama'}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                          <span className="bg-gray-600 px-2 py-1 rounded">
                            {config.ports?.portIds?.length || 0} pelabuhan utama
                          </span>
                          <span className="bg-gray-600 px-2 py-1 rounded">
                            {config.wilayah_aktif?.length || 0} wilayah
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8 bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/10">
          
          {/* Progress Indicator */}
          <ProgressIndicator formData={formData} />

          {/* Tab Navigation */}
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              <TabButton
                active={activeTab === 'basic'}
                onClick={() => setActiveTab('basic')}
                icon="info"
                label="Informasi Dasar"
              />
              <TabButton
                active={activeTab === 'wilayah'}
                onClick={() => setActiveTab('wilayah')}
                icon="map"
                label="Wilayah Perairan"
                count={formData.wilayahAktif?.length}
              />
              <TabButton
                active={activeTab === 'location'}
                onClick={() => setActiveTab('location')}
                icon="location"
                label="Lokasi Anda"
                count={formData.yourLocation ? 'dot' : null}
              />
              <TabButton
                active={activeTab === 'ports'}
                onClick={() => setActiveTab('ports')}
                icon="port"
                label="Pelabuhan"
                count={(formData.portIds?.length || 0) + (formData.portEndPoints?.length || 0) || null}
              />
              <TabButton
                active={activeTab === 'background'}
                onClick={() => setActiveTab('background')}
                icon="image"
                label="Latar Belakang"
              />
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'basic' && (
              <BasicInfoTab 
                formData={formData} 
                idValidation={idValidation} 
                handleInputChange={handlers.handleInputChange} 
              />
            )}

            {activeTab === 'wilayah' && (
              <WilayahTab
                formData={formData}
                CoordinatePicker={CoordinatePicker}
                handleViewportChangeFromWilayah={handlers.handleViewportChangeFromWilayah}
                handleWilayahClick={handlers.handleWilayahClick}
                enableLabelConfig={enableLabelConfig}
                setEnableLabelConfig={setEnableLabelConfig}
                enableConnectorConfig={enableConnectorConfig}
                setEnableConnectorConfig={setEnableConnectorConfig}
                handleLabelPositionChange={handlers.handleLabelPositionChange}
                handleConnectorStartChange={handlers.handleConnectorStartChange}
                fillDummyLabelPositions={handlers.fillDummyLabelPositions}
                fillDummyConnectorPositions={handlers.fillDummyConnectorPositions}
                setFormData={setFormData}
                KATEGORI_GELOMBANG={KATEGORI_GELOMBANG}
                theme={theme}
              />
            )}

            {activeTab === 'location' && (
              <LocationTab
                formData={formData}
                CoordinatePicker={CoordinatePicker}
                handleCoordinateChange={handlers.handleCoordinateChange}
              />
            )}

            {activeTab === 'ports' && (
              <PortsTab
                formData={formData}
                portMapping={portMapping}
                CoordinatePicker={CoordinatePicker}
                handlePortClick={handlers.handlePortClick}
                handleRemovePort={handlers.handleRemovePort}
                handleRemoveEndpoint={handlers.handleRemoveEndpoint}
                handleMoveToEndpoints={handlers.handleMoveToEndpoints}
                handleMoveToMain={handlers.handleMoveToMain}
              />
            )}

            {activeTab === 'background' && (
              <BackgroundTab
                handleImageUpload={handlers.handleImageUpload}
                handleRemoveImage={handlers.handleRemoveImage}
              />
            )}
          </div>
        </form>

        {/* Configuration Summary */}
        <ConfigSummary formData={formData} />

        {/* Action Buttons */}
        <ActionButtons
          setShowPreview={setShowPreview}
          handleSaveToAPI={handleSaveToAPI}
          handleUpdateToAPI={handleUpdateToAPI}
          // handleLoadAllConfigs={handleLoadAllConfigs}
        />

        {/* Preview JSON - Collapsible
        <section className="mt-8">
          <details className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            <summary className="cursor-pointer p-6 hover:bg-gray-700/30 transition-colors">
              <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Pratinjau JSON Konfigurasi
              </h2>
            </summary>
            <div className="p-6 pt-0">
              <pre className="bg-gray-900/70 border border-white/10 rounded-lg p-4 overflow-auto text-sm max-h-96">
                {configJson}
              </pre>
            </div>
          </details>
        </section> */}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
