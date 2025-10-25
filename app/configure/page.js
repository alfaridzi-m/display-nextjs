// app/configure/page.js
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
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

// Dynamically import the map component to avoid SSR issues with Leaflet
const CoordinatePicker = dynamic(() => import("../components/CoordinatePicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-gray-700 animate-pulse rounded-md flex items-center justify-center">
      <p>Memuat peta...</p>
    </div>
  ),
});

export default function ConfigurePage() {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState('weather');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [idValidation, setIdValidation] = useState({ isValid: true, message: '', isChecking: false });
  
  const [formData, setFormData] = useState({
    id: "",
    displayTitle: "",
    // map settings inputs
    viewPointLat: "",
    viewPointLng: "",
    initialZoom: 8,
    // your location via map picker
    yourLocation: null, // { lat, lng }
    // selections via map clicks
    portIds: [], // array of strings (port codes)
    portEndPoints: [], // array of strings (port codes)
    wilayahAktif: [], // array of strings (wilayah codes)
  });

  const theme = isDarkMode ? darkTheme : lightTheme;
  const pages = ['weather', 'cities', 'Perairan', 'Peta'];
  const pageDurations = {
    weather: 1500000 * (formData.portIds?.length || 1),
    cities: 300000,
    Perairan: 1500000,
    Peta: 6000000,
  };

  // Load port data for mapping codes to names
  const [portMapping, setPortMapping] = useState({});
  
  useEffect(() => {
    fetch('/pelabuhan.geojson')
      .then(r => r.json())
      .then(data => {
        const mapping = {};
        if (data.features) {
          data.features.forEach(feature => {
            const code = feature.properties?.code;
            const location = feature.properties?.location;
            if (code && location) {
              mapping[code] = location;
            }
          });
        }
        setPortMapping(mapping);
      })
      .catch(err => console.error('Failed to load port data:', err));
  }, []);

  // Debounced ID validation check
  useEffect(() => {
    const checkIdAvailability = async () => {
      if (!formData.id) {
        setIdValidation({ isValid: true, message: '', isChecking: false });
        return;
      }

      // Check format first
      if (!/^[a-zA-Z0-9]+$/.test(formData.id)) {
        setIdValidation({ 
          isValid: false, 
          message: 'ID hanya boleh berisi huruf dan angka', 
          isChecking: false 
        });
        return;
      }

      setIdValidation({ isValid: true, message: '', isChecking: true });

      try {
        const response = await fetch(`/api/configure?id=${formData.id}`);
        const result = await response.json();
        
        if (result.success) {
          // ID exists - block it
          setIdValidation({ 
            isValid: false, 
            message: 'ID sudah digunakan. Silakan pilih ID lain.', 
            isChecking: false,
            isWarning: false 
          });
        } else {
          // ID available
          setIdValidation({ 
            isValid: true, 
            message: 'ID tersedia', 
            isChecking: false 
          });
        }
      } catch (error) {
        console.error('Error checking ID:', error);
        setIdValidation({ isValid: true, message: '', isChecking: false });
      }
    };

    const timeoutId = setTimeout(checkIdAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.id]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Validate ID field: only alphanumeric characters (no spaces or special characters)
    if (name === 'id') {
      const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '');
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleCoordinateChange = useCallback((latlng) => {
    setFormData((prev) => ({ ...prev, yourLocation: { lat: latlng.lat, lng: latlng.lng } }));
  }, []);

  // Update form when map moves/zooms (only from Wilayah map)
  const handleViewportChangeFromWilayah = useCallback(({ center, zoom }) => {
    setFormData((prev) => ({
      ...prev,
      viewPointLat: String(center.lat.toFixed(6)),
      viewPointLng: String(center.lng.toFixed(6)),
      initialZoom: zoom,
    }));
  }, []);

  const handlePortClick = useCallback((portCode) => {
    setFormData((prev) => {
      const current = prev.portIds || [];
      const exists = current.includes(portCode);
      return {
        ...prev,
        portIds: exists ? current.filter((p) => p !== portCode) : [...current, portCode],
      };
    });
  }, []);

  const handleRemovePort = useCallback((portCode) => {
    setFormData((prev) => ({
      ...prev,
      portIds: (prev.portIds || []).filter((p) => p !== portCode),
    }));
  }, []);

  const handleRemoveEndpoint = useCallback((portCode) => {
    setFormData((prev) => ({
      ...prev,
      portEndPoints: (prev.portEndPoints || []).filter((p) => p !== portCode),
    }));
  }, []);

  const handleMoveToEndpoints = useCallback((portCode) => {
    setFormData((prev) => ({
      ...prev,
      portIds: (prev.portIds || []).filter((p) => p !== portCode),
      portEndPoints: [...(prev.portEndPoints || []), portCode],
    }));
  }, []);

  const handleMoveToMain = useCallback((portCode) => {
    setFormData((prev) => ({
      ...prev,
      portEndPoints: (prev.portEndPoints || []).filter((p) => p !== portCode),
      portIds: [...(prev.portIds || []), portCode],
    }));
  }, []);

  const handleWilayahClick = useCallback((wilayahCode, wilayahInfo) => {
    setFormData((prev) => {
      const current = prev.wilayahAktif || [];
      const exists = current.includes(wilayahCode);
      return {
        ...prev,
        wilayahAktif: exists ? current.filter((w) => w !== wilayahCode) : [...current, wilayahCode],
      };
    });
  }, []);

  const configObject = useMemo(() => {
    const vpLat = parseFloat(formData.viewPointLat);
    const vpLng = parseFloat(formData.viewPointLng);
    const vp = [vpLat, vpLng];
    const yourLoc = formData.yourLocation
      ? [Number(formData.yourLocation.lat), Number(formData.yourLocation.lng)]
      : null;
    return {
      id: formData.id || undefined,
      displayTitle: formData.displayTitle || undefined,
      ports: {
        portIds: formData.portIds || [],
        portEndPoints: formData.portEndPoints || [],
      },
      wilayah_aktif: formData.wilayahAktif || [],
      map_settings: {
        view_point: Number.isFinite(vpLat) && Number.isFinite(vpLng) ? vp : undefined,
        initial_zoom: Number(formData.initialZoom) || 8,
        your_location: yourLoc || undefined,
      },
    };
  }, [formData]);

  const configJson = useMemo(() => JSON.stringify(configObject, null, 2), [configObject]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Konfigurasi:", configObject);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(configJson).then(
        () => alert("Konfigurasi disalin ke clipboard!"),
        () => alert("Gagal menyalin ke clipboard, tetapi data ada di console.")
      );
    } else {
      alert("Konfigurasi ditampilkan di console log.");
    }
  };

  // Save configuration to API (POST or PUT)
  const handleSaveToAPI = async () => {
    if (!configObject.id) {
      alert("ID Konfigurasi harus diisi!");
      return;
    }

    // Block saving if ID validation failed
    if (!idValidation.isValid) {
      alert("ID Konfigurasi tidak valid. " + idValidation.message);
      return;
    }

    try {
      // Double check to ensure ID doesn't exist (safety check)
      const checkResponse = await fetch(`/api/configure?id=${configObject.id}`);
      const checkData = await checkResponse.json();
      
      if (checkData.success) {
        // ID exists - block saving
        alert(`ID "${configObject.id}" sudah digunakan. Silakan pilih ID lain.`);
        return;
      }
      
      // ID is available, proceed with POST
      const response = await fetch('/api/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configObject),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Konfigurasi berhasil disimpan!');
      } else {
        alert(`Gagal menyimpan: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Terjadi kesalahan saat menyimpan konfigurasi');
    }
  };

  // Load configuration from API
  const handleLoadFromAPI = async () => {
    const configId = prompt("Masukkan ID Konfigurasi yang ingin dimuat:");
    if (!configId) return;

    try {
      const response = await fetch(`/api/configure?id=${configId}`);
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
        });
        alert("Konfigurasi berhasil dimuat!");
      } else {
        alert(`Konfigurasi tidak ditemukan: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      alert('Terjadi kesalahan saat memuat konfigurasi');
    }
  };

  // Load all configurations
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [showConfigList, setShowConfigList] = useState(false);

  const handleLoadAllConfigs = async () => {
    try {
      const response = await fetch('/api/configure');
      const result = await response.json();

      if (result.success) {
        setSavedConfigs(result.data);
        setShowConfigList(true);
      } else {
        alert(`Gagal memuat daftar konfigurasi: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      alert('Terjadi kesalahan saat memuat daftar konfigurasi');
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
    });
    setShowConfigList(false);
    alert(`Konfigurasi "${config.displayTitle || config.id}" berhasil dimuat!`);
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
          className={`min-h-screen flex flex-col md:flex-row font-sans relative overflow-hidden dark bg-cover bg-center`}
          style={{ backgroundImage: `url(${theme.background.image})` }}
        >
          <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full filter blur-3xl opacity-70 animate-blob ${theme.overlay}`}></div>
          <div className={`absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-4000 ${theme.overlay2}`}></div>

          {/* Exit Preview Button */}
          <button
            onClick={() => setShowPreview(false)}
            className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
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
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Pengaturan Tampilan
            </h1>
            <p className="text-gray-400 mt-2">
                Atur informasi utama yang akan ditampilkan pada layar monitor Anda.
            </p>
        </header>

        {/* Saved Configurations List Modal */}
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
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
          
          {/* ID and Kota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-300 mb-2">ID Konfigurasi</label>
              <div className="relative">
                <input
                  type="text"
                  name="id"
                  id="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  className={`w-full bg-gray-700 border rounded-lg p-3 pr-10 focus:ring-2 focus:outline-none transition-all duration-300 ${
                    !formData.id 
                      ? 'border-gray-600 focus:ring-blue-500 focus:border-blue-500' 
                      : idValidation.isChecking
                      ? 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500'
                      : idValidation.isValid
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                      : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  }`}
                  placeholder="Contoh: mks1992"
                  pattern="[a-zA-Z0-9]+"
                  title="Hanya huruf dan angka (tanpa spasi atau karakter khusus)"
                />
                {formData.id && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {idValidation.isChecking ? (
                      <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : idValidation.isValid ? (
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {formData.id && idValidation.message && (
                <p className={`text-xs mt-1 ${
                  idValidation.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {idValidation.message}
                </p>
              )}
              {!formData.id && (
                <p className="text-xs text-gray-400 mt-1">Hanya huruf dan angka, tanpa spasi atau karakter khusus</p>
              )}
            </div>
            <div>
              <label htmlFor="displayTitle" className="block text-sm font-medium text-gray-300 mb-2">Nama Display</label>
              <input
                type="text"
                name="displayTitle"
                id="displayTitle"
                value={formData.displayTitle}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Contoh: Display Cuaca Pelabuhan Makassar"
              />
            </div>
          </div>

          {/* Map Settings: View Point and Zoom */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">View Point - Latitude</label>
              <input
                type="number"
                step="any"
                name="viewPointLat"
                value={formData.viewPointLat}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Contoh: -3.424"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">View Point - Longitude</label>
              <input
                type="number"
                step="any"
                name="viewPointLng"
                value={formData.viewPointLng}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Contoh: 128.9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Initial Zoom</label>
              <input
                type="number"
                min="1"
                max="18"
                name="initialZoom"
                value={formData.initialZoom}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="Contoh: 8"
              />
            </div>
          </div>

          {/* Map 1: Wilayah Aktif Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Peta Wilayah Aktif (Klik polygon untuk memilih) - View Point Controller
            </label>
            <div className="relative w-full aspect-video rounded-md overflow-hidden">
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
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Wilayah Aktif terpilih: {formData.wilayahAktif?.length || 0} wilayah. Pan/zoom peta ini untuk mengatur View Point.
            </p>
            
            {/* Display selected Wilayah Aktif below the map */}
            {formData.wilayahAktif?.length > 0 && (
              <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-200">Wilayah Aktif Terpilih</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.wilayahAktif.map((w) => (
                    <span key={w} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-md text-xs border border-gray-600">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
            

          </div>

          {/* Map 2: Your Location Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Location (Klik pada peta untuk mengatur lokasi Anda)
            </label>
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
            <p className="text-xs text-gray-400 mt-2">
              Klik pada peta untuk menentukan lokasi Anda. 
              {formData.yourLocation && (
                <span className="text-green-400 ml-1">
                  Lokasi terpilih: [{formData.yourLocation.lat.toFixed(5)}, {formData.yourLocation.lng.toFixed(5)}]
                </span>
              )}
            </p>
          </div>

          {/* Map 3: Port IDs Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Peta Port IDs (Klik marker untuk memilih)
            </label>
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
            <p className="text-xs text-gray-400 mt-2">Klik pada titik pelabuhan untuk memilih informasi pelabuhan yang akan ditampilkan</p>
            
            {/* Pelabuhan Utama (Main Ports) */}
            {formData.portIds && formData.portIds.length > 0 && (
              <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">Pelabuhan Utama:</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.portIds.map((portId) => (
                    <div
                      key={portId}
                      className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/50 rounded-md px-3 py-2 group hover:bg-blue-600/30 transition-colors"
                    >
                      <span className="text-sm font-medium text-blue-200">
                        {portMapping[portId] || portId}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveToEndpoints(portId)}
                          className="text-blue-300 hover:text-green-400 transition-colors"
                          title={`Pindah ke Pelabuhan Sekitar`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePort(portId)}
                          className="text-blue-300 hover:text-red-400 transition-colors"
                          title={`Hapus ${portMapping[portId] || portId}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Hanya pelabuhan utama yang menampilkan info lengkap. Tekan tanda + untuk memindahkan pelabuhan ke informasi rangkuman.</p>
              </div>
            )}
            
            {/* Pelabuhan Sekitar (Endpoint Ports) */}
            {formData.portEndPoints && formData.portEndPoints.length > 0 && (
              <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">Pelabuhan Sekitar:</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.portEndPoints.map((portId) => (
                    <div
                      key={portId}
                      className="flex items-center gap-2 bg-green-600/20 border border-green-500/50 rounded-md px-3 py-2 group hover:bg-green-600/30 transition-colors"
                    >
                      <span className="text-sm font-medium text-green-200">
                        {portMapping[portId] || portId}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveToMain(portId)}
                          className="text-green-300 hover:text-blue-400 transition-colors"
                          title={`Pindah ke Pelabuhan Utama`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEndpoint(portId)}
                          className="text-green-300 hover:text-red-400 transition-colors"
                          title={`Hapus ${portMapping[portId] || portId}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button - Removed */}
        </form>

        {/* Action Buttons */}
        <section className="mt-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button 
              type="button" 
              onClick={() => setShowPreview(true)} 
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Preview Dashboard
            </button>
            <button type="button" onClick={handleDownload} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm">
              Unduh JSON
            </button>
            <button type="button" onClick={handleSaveToAPI} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Simpan ke Server
            </button>
            <button type="button" onClick={handleLoadFromAPI} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Muat dari Server
            </button>
            <button type="button" onClick={handleLoadAllConfigs} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Lihat Semua Konfigurasi
            </button>
          </div>
        </section>

        {/* Preview JSON */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Pratinjau Konfigurasi</h2>
          <pre className="bg-gray-900/70 border border-white/10 rounded-lg p-4 overflow-auto text-sm">
            {configJson}
          </pre>
        </section>
      </div>
    </div>
  );
}
