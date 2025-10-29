// app/configure/page.js
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
  const [showPreview, setShowPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState('weather');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [idValidation, setIdValidation] = useState({ isValid: true, message: '', isChecking: false });
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'wilayah', 'location', 'ports'
  const [enableLabelConfig, setEnableLabelConfig] = useState(false);
  const [enableConnectorConfig, setEnableConnectorConfig] = useState(false);
  const [waveLegendPosition, setWaveLegendPosition] = useState({ x: null, y: null });
  const [isDraggingWaveLegend, setIsDraggingWaveLegend] = useState(false);
  
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
    // perairan display settings
    labelPosition: "center", // label position for weather info
    individualPositions: {}, // individual label positions per region
    connectorStartPositions: {}, // connector start positions per region
    legendPosition: { bottom: 8, right: 8 }, // legend position
    legendSize: { width: "auto", height: "auto" }, // legend size
    waveLegendPosition: { x: null, y: null }, // wave legend position from drag (null = use default)
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

  // Sync wave legend position with formData
  useEffect(() => {
    if (formData.waveLegendPosition) {
      setWaveLegendPosition(formData.waveLegendPosition);
    }
  }, [formData.waveLegendPosition]);

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
      
      // If adding a new wilayah, initialize connector position with center
      const newConnectorPositions = { ...prev.connectorStartPositions };
      
      if (!exists && wilayahInfo?.geometry) {
        // Calculate center from geometry bounds
        try {
          const geometry = wilayahInfo.geometry;
          if (geometry && geometry.coordinates) {
            // For polygon, calculate approximate center
            let sumLat = 0, sumLng = 0, count = 0;
            const coords = geometry.type === 'Polygon' ? geometry.coordinates[0] : 
                          geometry.type === 'MultiPolygon' ? geometry.coordinates[0][0] : [];
            
            coords.forEach(([lng, lat]) => {
              if (typeof lat === 'number' && typeof lng === 'number') {
                sumLat += lat;
                sumLng += lng;
                count++;
              }
            });
            
            if (count > 0) {
              newConnectorPositions[wilayahCode] = {
                lat: sumLat / count,
                lng: sumLng / count
              };
            }
          }
        } catch (err) {
          console.error('Error calculating center for wilayah:', err);
        }
      } else if (exists) {
        // Remove connector position when removing wilayah
        delete newConnectorPositions[wilayahCode];
      }
      
      return {
        ...prev,
        wilayahAktif: exists ? current.filter((w) => w !== wilayahCode) : [...current, wilayahCode],
        connectorStartPositions: newConnectorPositions
      };
    });
  }, []);

  // Handle label position change from draggable markers
  const handleLabelPositionChange = useCallback((wilayahId, position) => {
    setFormData((prev) => ({
      ...prev,
      individualPositions: {
        ...(prev.individualPositions || {}),
        [wilayahId]: position
      }
    }));
  }, []);

  // Handle connector start position change from draggable markers
  const handleConnectorStartChange = useCallback((wilayahId, position) => {
    setFormData((prev) => ({
      ...prev,
      connectorStartPositions: {
        ...(prev.connectorStartPositions || {}),
        [wilayahId]: position
      }
    }));
  }, []);

  // Handle wave legend drag
  const handleWaveLegendMouseDown = useCallback((e) => {
    setIsDraggingWaveLegend(true);
    e.preventDefault();
  }, []);

  const handleWaveLegendMouseMove = useCallback((e) => {
    if (!isDraggingWaveLegend) return;
    
    const mapContainer = e.currentTarget;
    const rect = mapContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setWaveLegendPosition({ x, y });
    setFormData(prev => ({
      ...prev,
      waveLegendPosition: { x, y }
    }));
  }, [isDraggingWaveLegend]);

  const handleWaveLegendMouseUp = useCallback(() => {
    setIsDraggingWaveLegend(false);
  }, []);

  // Fill dummy data for label positions
  const fillDummyLabelPositions = useCallback(() => {
    const dummyPositions = {};
    formData.wilayahAktif?.forEach((wilayahId, index) => {
      // Use connector position as base, or generate sample coordinates
      const basePos = formData.connectorStartPositions?.[wilayahId];
      if (basePos) {
        // Offset slightly from connector position for label
        dummyPositions[wilayahId] = {
          lat: basePos.lat + (index % 2 === 0 ? 0.5 : -0.5),
          lng: basePos.lng + (index % 3 === 0 ? 0.8 : -0.8)
        };
      } else {
        // Generate sample coordinates as fallback
        dummyPositions[wilayahId] = {
          lat: -5.0 + (index * 0.5),
          lng: 120.0 + (index * 0.8)
        };
      }
    });
    setFormData(prev => ({
      ...prev,
      individualPositions: dummyPositions
    }));
  }, [formData.wilayahAktif, formData.connectorStartPositions]);

  // Fill dummy data for connector positions
  const fillDummyConnectorPositions = useCallback(() => {
    const dummyPositions = {};
    formData.wilayahAktif?.forEach((wilayahId, index) => {
      // Generate sample coordinates (example for Indonesia region)
      dummyPositions[wilayahId] = {
        lat: -5.0 + (index * 0.5),
        lng: 120.0 + (index * 0.8)
      };
    });
    setFormData(prev => ({
      ...prev,
      connectorStartPositions: dummyPositions
    }));
  }, [formData.wilayahAktif]);

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
      perairan_settings: {
        label_position: formData.labelPosition || "top-left",
        individual_positions: formData.individualPositions || {},
        connector_start_positions: formData.connectorStartPositions || {},
        wave_legend_position: formData.waveLegendPosition || { x: null, y: null },
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
        // Save the ID to localStorage
        try {
          localStorage.setItem('displayConfigId', configObject.id);
          console.log('Config ID saved to localStorage:', configObject.id);
        } catch (storageError) {
          console.warn('Failed to save config ID to localStorage:', storageError);
        }
        alert('Konfigurasi berhasil disimpan!');
        
        // Ask if user wants to use this configuration now
        const useNow = confirm('Konfigurasi berhasil disimpan! Apakah Anda ingin menggunakan konfigurasi ini sekarang?');
        if (useNow) {
          window.location.href = '/';
        }
      } else {
        alert(`Gagal menyimpan: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Terjadi kesalahan saat menyimpan konfigurasi');
    }
  };

  // Update existing configuration using PUT
  const handleUpdateToAPI = async () => {
    if (!configObject.id) {
      alert("ID Konfigurasi harus diisi!");
      return;
    }

    try {
      // Check if configuration exists
      const checkResponse = await fetch(`/api/configure?id=${configObject.id}`);
      const checkData = await checkResponse.json();
      
      if (!checkData.success) {
        // ID doesn't exist - can't update
        alert(`ID "${configObject.id}" tidak ditemukan. Gunakan "Simpan ke Server" untuk membuat konfigurasi baru.`);
        return;
      }
      
      // Confirm update
      const confirmUpdate = confirm(`Apakah Anda yakin ingin memperbarui konfigurasi "${configObject.id}"?`);
      if (!confirmUpdate) {
        return;
      }
      
      // Proceed with PUT
      const response = await fetch('/api/configure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configObject),
      });

      const result = await response.json();
    
      if (result.success) {
        alert('Konfigurasi berhasil diperbarui!');
      } else {
        alert(`Gagal memperbarui: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      alert('Terjadi kesalahan saat memperbarui konfigurasi');
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
          labelPosition: config.perairan_settings?.label_position || "center",
          individualPositions: config.perairan_settings?.individual_positions || {},
          connectorStartPositions: config.perairan_settings?.connector_start_positions || {},
          legendPosition: config.perairan_settings?.legend_position || { bottom: 8, right: 8 },
          legendSize: config.perairan_settings?.legend_size || { width: "auto", height: "auto" },
          waveLegendPosition: config.perairan_settings?.wave_legend_position || { x: null, y: null },
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
      labelPosition: config.perairan_settings?.label_position || "center",
      individualPositions: config.perairan_settings?.individual_positions || {},
      connectorStartPositions: config.perairan_settings?.connector_start_positions || {},
      legendPosition: config.perairan_settings?.legend_position || { bottom: 8, right: 8 },
      legendSize: config.perairan_settings?.legend_size || { width: "auto", height: "auto" },
      waveLegendPosition: config.perairan_settings?.wave_legend_position || { x: null, y: null },
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
                  labelPosition={configObject.perairan_settings?.label_position}
                  individualPositions={configObject.perairan_settings?.individual_positions}
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
      <div className="max-w-[1900px] mx-auto">
        <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/config-select')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali
              </button>
            </div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Pengaturan Tampilan
            </h1>
            <p className="text-gray-400 mt-2">
                Atur informasi utama yang akan ditampilkan pada layar monitor Anda. Gunakan tab untuk navigasi yang mudah.
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
          
          {/* Progress Indicator */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-300 mb-3">Progress Konfigurasi</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`flex items-center gap-2 p-2 rounded ${formData.id && formData.displayTitle ? 'bg-green-900/30 border border-green-500/50' : 'bg-gray-700/30 border border-gray-600/50'}`}>
                {formData.id && formData.displayTitle ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-xs">Info Dasar</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded ${formData.wilayahAktif?.length > 0 ? 'bg-green-900/30 border border-green-500/50' : 'bg-gray-700/30 border border-gray-600/50'}`}>
                {formData.wilayahAktif?.length > 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-xs">Wilayah</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded ${formData.yourLocation ? 'bg-green-900/30 border border-green-500/50' : 'bg-gray-700/30 border border-gray-600/50'}`}>
                {formData.yourLocation ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-xs">Lokasi</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded ${(formData.portIds?.length > 0 || formData.portEndPoints?.length > 0) ? 'bg-green-900/30 border border-green-500/50' : 'bg-gray-700/30 border border-gray-600/50'}`}>
                {(formData.portIds?.length > 0 || formData.portEndPoints?.length > 0) ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-xs">Pelabuhan</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all ${
                  activeTab === 'basic'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Informasi Dasar
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('wilayah')}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all ${
                  activeTab === 'wilayah'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                  </svg>
                  Wilayah Perairan
                  {formData.wilayahAktif?.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                      {formData.wilayahAktif.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('location')}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all ${
                  activeTab === 'location'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Lokasi Anda
                  {formData.yourLocation && (
                    <span className="ml-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ports')}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-all ${
                  activeTab === 'ports'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 408.66 256.38" fill="currentColor">
                    <path d="M408.66,147.14l-53.36,113.92c-1.77,3.18-3.73,5.83-7.3,7.07H27.77c-13.82-7.51-3.3-19.59.97-29.43,2.38-5.48,5.2-8.45,1.65-13.91-5.23-8.04-11.99-14.6-17.1-23.62-4.57-8.07-14.89-30.28-13.08-38.91.7-3.34,4.6-7.94,8.03-7.94h13.17v-34.73c-2.69-1.84-6.89-1.9-7.77-5.78-.66-2.9-.6-18.3.39-20.76s5.19-4.99,7.78-4.99h17.17v-45.91c0-2.26,5.28-6.79,7.59-6.79h26.75V6.22c0-5.07,6.42-8.22,10.36-4.77.58.5,2.41,4.32,2.41,4.77v29.14h26.75c2.58,0,7.59,4.91,7.59,7.59v45.11h17.17c2.59,0,6.76,2.45,7.78,4.99s1.06,17.96.25,20.6c-1.11,3.6-4.84,4.36-7.63,5.94v34.73h19.16V54.13c0-2.47,7.5-5.78,9.95-5.22,32.04,2.1,67.43-2.7,99.06,0,3.06.26,7.4.92,9.06,3.72.29.49,1.69,4.45,1.69,4.7v44.31h45.11c2.16,0,8.38,5.64,8.38,7.59v37.13l2.85-5.54c3.07-3.82,6.85-6.67,11.92-7.24,16.81-1.89,37.06,1.37,54.24.05,4.81,1.07,7.36,4.48,9.23,8.73v4.79ZM108.44,47.34h-57.49v40.72h57.49v-40.72ZM210.64,60.91h-41.52v40.72h41.52v-40.72ZM264.94,101.63v-39.52l-1.2-1.2h-41.12v40.72h42.32ZM133.99,100.84H25.41v6.39h14.77c.88,0,2.88,2.07,3.24,3.14,2.45,7.29-4.02,9.46-10.03,8.84v35.13h92.62v-35.13h-60.28c-.23,0-3.59-1.98-3.97-2.42-2.41-2.83-.9-9.56,2.37-9.56h69.86v-6.39ZM210.64,113.61h-41.52v40.72h41.52v-40.72ZM264.94,154.33v-39.52l-1.2-1.2h-41.12v40.72h42.32ZM318.43,113.61h-41.52v40.72h41.52v-40.72ZM395.88,145.55h-49.9c-3.73,0-3.67,7.97-4.63,10.54-1.39,3.73-8.21,10.22-12.14,10.22H12.63c3.79,21.14,16.56,38.93,30.07,54.96l231.46.09c8.92,2.95,4.53,12.72-4,12.04l-225.86-.06-10.91,23.19h310.19l10.78-23.15h-53.1c-.23,0-3.8-1.53-4.17-1.83-3.55-2.94-1.83-8.96,2.59-10.13l60.94-.15,35.26-75.72Z"/>
                  </svg>
                  Pelabuhan
                  {(formData.portIds?.length > 0 || formData.portEndPoints?.length > 0) && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                      {(formData.portIds?.length || 0) + (formData.portEndPoints?.length || 0)}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Identitas Display
                  </h3>
                  
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
                </div>
              </div>
            )}

            {/* Wilayah Perairan Tab */}
            {activeTab === 'wilayah' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Pengaturan Peta
                  </h3>

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
                  <p className="text-xs text-gray-400 mt-2">
                    <strong>Tip:</strong> Atur view point dan zoom menggunakan peta interaktif di bawah, atau masukkan nilai secara manual di form ini.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                    </svg>
                    Pilih Wilayah Perairan
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Klik pada polygon wilayah di peta untuk memilih wilayah perairan yang akan ditampilkan. 
                    Anda juga dapat mengatur view point dan zoom dengan menggeser dan memperbesar/memperkecil peta.
                  </p>


          {/* Map 1: Wilayah Aktif Selection */}
          <div>
            <div 
              className="relative w-[1741px] h-[878px] rounded-md overflow-hidden mx-auto border-2 border-cyan-500/30"
              onMouseMove={handleWaveLegendMouseMove}
              onMouseUp={handleWaveLegendMouseUp}
              onMouseLeave={handleWaveLegendMouseUp}
            >
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
              <div 
                className="absolute z-[1000] w-64"
                style={{
                  left: waveLegendPosition.x !== null ? `${waveLegendPosition.x}px` : 'auto',
                  top: waveLegendPosition.y !== null ? `${waveLegendPosition.y}px` : 'auto',
                  right: waveLegendPosition.x === null ? '1rem' : 'auto',
                  bottom: waveLegendPosition.y === null ? '1rem' : 'auto',
                  cursor: isDraggingWaveLegend ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleWaveLegendMouseDown}
              >
                <div className={`relative bg-white/80 backdrop-blur rounded-md p-3 shadow border ${isDraggingWaveLegend ? 'border-blue-400 ring-2 ring-blue-300' : 'border-white/30'} transition-all h-full flex flex-col`}>
                  <div className={`text-base font-semibold mb-2 ${theme.text.primary} flex items-center justify-between shrink-0`}>
                    <span>Legenda Gelombang</span>
                    {isDraggingWaveLegend && <span className="text-xl">📍</span>}
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
              <strong>Wilayah terpilih:</strong> {formData.wilayahAktif?.length || 0} wilayah  •  
              <strong className="ml-2">View Point:</strong> [{formData.viewPointLat || '-'}, {formData.viewPointLng || '-'}]  •  
              <strong className="ml-2">Zoom:</strong> {formData.initialZoom}
            </p>
            
            {/* Display selected Wilayah Aktif below the map */}
            {formData.wilayahAktif?.length > 0 && (
              <div className="mt-4 p-4 bg-cyan-900/20 rounded-lg border border-cyan-600/40">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-cyan-200">Wilayah Aktif Terpilih</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.wilayahAktif.map((w) => (
                    <span key={w} className="bg-cyan-700/30 text-cyan-200 px-3 py-1 rounded-md text-xs border border-cyan-600/50">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Pengaturan Tampilan Perairan
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Atur posisi label, konektor, dan legenda pada tampilan peta perairan.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Wave Legend Position Info */}
                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">Posisi Legenda Gelombang</label>
                        {formData.waveLegendPosition?.x !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                waveLegendPosition: { x: null, y: null }
                              }));
                              setWaveLegendPosition({ x: null, y: null });
                            }}
                            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      {formData.waveLegendPosition?.x !== null && formData.waveLegendPosition?.x !== undefined ? (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-300">
                            <span className="font-medium">X:</span> {Math.round(formData.waveLegendPosition?.x ?? 0)}px
                          </div>
                          <div className="text-xs text-gray-300">
                            <span className="font-medium">Y:</span> {Math.round(formData.waveLegendPosition?.y ?? 0)}px
                          </div>
                          <p className="text-xs text-green-400 mt-2">
                            ✓ Posisi custom tersimpan
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">
                          <p>Posisi default: Kanan bawah</p>
                          <p className="mt-2 text-yellow-400">
                            💡 Seret legenda di peta untuk mengatur posisi custom
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Individual Label Positions & Connector Positions Side by Side */}
                    <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Individual Label Positions - with checkbox */}
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
                              {formData.wilayahAktif.map((wilayahId) => (
                                <div key={wilayahId} className="bg-gray-700/40 border border-gray-600/50 rounded p-2 w-full max-w-[200px]">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold text-cyan-300 truncate">{wilayahId}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => {
                                          const newPositions = { ...prev.individualPositions };
                                          delete newPositions[wilayahId];
                                          return { ...prev, individualPositions: newPositions };
                                        });
                                      }}
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
                                        value={formData.individualPositions[wilayahId]?.lat || ''}
                                        onChange={(e) => setFormData(prev => ({
                                          ...prev,
                                          individualPositions: {
                                            ...prev.individualPositions,
                                            [wilayahId]: {
                                              ...prev.individualPositions[wilayahId],
                                              lat: Number(e.target.value)
                                            }
                                          }
                                        }))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Auto"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-gray-400 mb-0.5">Longitude</label>
                                      <input
                                        type="number"
                                        step="0.0001"
                                        value={formData.individualPositions[wilayahId]?.lng || ''}
                                        onChange={(e) => setFormData(prev => ({
                                          ...prev,
                                          individualPositions: {
                                            ...prev.individualPositions,
                                            [wilayahId]: {
                                              ...prev.individualPositions[wilayahId],
                                              lng: Number(e.target.value)
                                            }
                                          }
                                        }))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Auto"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              <strong>Tip:</strong> Masukkan koordinat latitude dan longitude untuk posisi label cuaca pada setiap wilayah.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Centang kotak di atas untuk mengaktifkan konfigurasi posisi label individual</p>
                        )}
                      </div>

                      {/* Connector Start Positions - with checkbox */}
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
                              {formData.wilayahAktif.map((wilayahId) => (
                                <div key={wilayahId} className="bg-gray-700/40 border border-gray-600/50 rounded p-2 w-full max-w-[200px]">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold text-cyan-300 truncate">{wilayahId}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => {
                                          const newPositions = { ...prev.connectorStartPositions };
                                          delete newPositions[wilayahId];
                                          return { ...prev, connectorStartPositions: newPositions };
                                        });
                                      }}
                                      className="text-[10px] text-red-400 hover:text-red-300 ml-1"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div>
                                      <label className="block text-[10px] text-gray-400 mb-0.5">Lat</label>
                                      <input
                                        type="number"
                                        step="any"
                                        value={formData.connectorStartPositions[wilayahId]?.lat || ''}
                                        onChange={(e) => setFormData(prev => ({
                                          ...prev,
                                          connectorStartPositions: {
                                            ...prev.connectorStartPositions,
                                            [wilayahId]: {
                                              ...prev.connectorStartPositions[wilayahId],
                                              lat: Number(e.target.value)
                                            }
                                          }
                                        }))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Auto"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-gray-400 mb-0.5">Lng</label>
                                      <input
                                        type="number"
                                        step="any"
                                        value={formData.connectorStartPositions[wilayahId]?.lng || ''}
                                        onChange={(e) => setFormData(prev => ({
                                          ...prev,
                                          connectorStartPositions: {
                                            ...prev.connectorStartPositions,
                                            [wilayahId]: {
                                              ...prev.connectorStartPositions[wilayahId],
                                              lng: Number(e.target.value)
                                            }
                                          }
                                        }))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Auto"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              <strong>Tip:</strong> Koordinat geografis untuk titik awal garis konektor.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Centang kotak di atas untuk mengaktifkan konfigurasi posisi konektor</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Tentukan Lokasi Anda
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Klik pada peta untuk menentukan lokasi kantor atau stasiun Anda. Lokasi ini akan ditampilkan sebagai marker pada peta display.
                  </p>

          {/* Map 2: Your Location Picker */}
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
                </div>
              </div>
            )}

            {/* Ports Tab */}
            {activeTab === 'ports' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
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
                    Klik marker pelabuhan pada peta untuk memilih. Gunakan tombol pada badge untuk memindahkan pelabuhan antar kategori.
                  </p>

          {/* Map 3: Port IDs Selection */}
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
            
            {/* Pelabuhan Utama (Main Ports) */}
            {formData.portIds && formData.portIds.length > 0 && (
              <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-600/40">
                <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  Pelabuhan Utama ({formData.portIds.length})
                </h3>
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
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Tip:</strong> Tekan tanda + untuk memindahkan pelabuhan ke kategori "Pelabuhan Sekitar"
                </p>
              </div>
            )}
            
            {/* Pelabuhan Sekitar (Endpoint Ports) */}
            {formData.portEndPoints && formData.portEndPoints.length > 0 && (
              <div className="mt-4 p-4 bg-green-900/20 rounded-lg border border-green-600/40">
                <h3 className="text-sm font-semibold text-green-200 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Pelabuhan Sekitar ({formData.portEndPoints.length})
                </h3>
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
                <p className="text-xs text-gray-400 mt-3">
                  <strong>Tip:</strong> Tekan tanda ↑ untuk memindahkan pelabuhan ke kategori "Pelabuhan Utama"
                </p>
              </div>
            )}
          </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Configuration Summary */}
        <section className="mt-8 bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Ringkasan Konfigurasi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-blue-300">ID & Nama</h3>
              </div>
              <p className="text-xs text-gray-400">ID: <span className="text-white">{formData.id || '-'}</span></p>
              <p className="text-xs text-gray-400 mt-1">Nama: <span className="text-white">{formData.displayTitle || '-'}</span></p>
            </div>

            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-cyan-300">Wilayah</h3>
              </div>
              <p className="text-2xl font-bold text-cyan-400">{formData.wilayahAktif?.length || 0}</p>
              <p className="text-xs text-gray-400">wilayah perairan</p>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-green-300">Lokasi</h3>
              </div>
              <p className="text-xs text-gray-400">
                {formData.yourLocation ? (
                  <>
                    <span className="text-green-400">✓ Sudah diatur</span>
                    <br />
                    <span className="text-white text-[10px]">[{formData.yourLocation.lat.toFixed(2)}, {formData.yourLocation.lng.toFixed(2)}]</span>
                  </>
                ) : (
                  <span className="text-gray-500">Belum diatur</span>
                )}
              </p>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 408.66 256.38" fill="currentColor">
                  <path d="M408.66,147.14l-53.36,113.92c-1.77,3.18-3.73,5.83-7.3,7.07H27.77c-13.82-7.51-3.3-19.59.97-29.43,2.38-5.48,5.2-8.45,1.65-13.91-5.23-8.04-11.99-14.6-17.1-23.62-4.57-8.07-14.89-30.28-13.08-38.91.7-3.34,4.6-7.94,8.03-7.94h13.17v-34.73c-2.69-1.84-6.89-1.9-7.77-5.78-.66-2.9-.6-18.3.39-20.76s5.19-4.99,7.78-4.99h17.17v-45.91c0-2.26,5.28-6.79,7.59-6.79h26.75V6.22c0-5.07,6.42-8.22,10.36-4.77.58.5,2.41,4.32,2.41,4.77v29.14h26.75c2.58,0,7.59,4.91,7.59,7.59v45.11h17.17c2.59,0,6.76,2.45,7.78,4.99s1.06,17.96.25,20.6c-1.11,3.6-4.84,4.36-7.63,5.94v34.73h19.16V54.13c0-2.47,7.5-5.78,9.95-5.22,32.04,2.1,67.43-2.7,99.06,0,3.06.26,7.4.92,9.06,3.72.29.49,1.69,4.45,1.69,4.7v44.31h45.11c2.16,0,8.38,5.64,8.38,7.59v37.13l2.85-5.54c3.07-3.82,6.85-6.67,11.92-7.24,16.81-1.89,37.06,1.37,54.24.05,4.81,1.07,7.36,4.48,9.23,8.73v4.79ZM108.44,47.34h-57.49v40.72h57.49v-40.72ZM210.64,60.91h-41.52v40.72h41.52v-40.72ZM264.94,101.63v-39.52l-1.2-1.2h-41.12v40.72h42.32ZM133.99,100.84H25.41v6.39h14.77c.88,0,2.88,2.07,3.24,3.14,2.45,7.29-4.02,9.46-10.03,8.84v35.13h92.62v-35.13h-60.28c-.23,0-3.59-1.98-3.97-2.42-2.41-2.83-.9-9.56,2.37-9.56h69.86v-6.39ZM210.64,113.61h-41.52v40.72h41.52v-40.72ZM264.94,154.33v-39.52l-1.2-1.2h-41.12v40.72h42.32ZM318.43,113.61h-41.52v40.72h41.52v-40.72ZM395.88,145.55h-49.9c-3.73,0-3.67,7.97-4.63,10.54-1.39,3.73-8.21,10.22-12.14,10.22H12.63c3.79,21.14,16.56,38.93,30.07,54.96l231.46.09c8.92,2.95,4.53,12.72-4,12.04l-225.86-.06-10.91,23.19h310.19l10.78-23.15h-53.1c-.23,0-3.8-1.53-4.17-1.83-3.55-2.94-1.83-8.96,2.59-10.13l60.94-.15,35.26-75.72Z"/>
                </svg>
                <h3 className="text-sm font-semibold text-purple-300">Pelabuhan</h3>
              </div>
              <p className="text-xs text-gray-400">Utama: <span className="text-blue-300 font-semibold">{formData.portIds?.length || 0}</span></p>
              <p className="text-xs text-gray-400 mt-1">Sekitar: <span className="text-green-300 font-semibold">{formData.portEndPoints?.length || 0}</span></p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-300">Aksi</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Preview */}
            <button 
              type="button" 
              onClick={() => setShowPreview(true)} 
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <div>Preview Dashboard</div>
                <div className="text-xs opacity-80">Lihat hasil konfigurasi</div>
              </div>
            </button>

            {/* Download */}
            <button 
              type="button" 
              onClick={handleDownload} 
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <div>Unduh JSON</div>
                <div className="text-xs opacity-80">Simpan ke komputer</div>
              </div>
            </button>

            {/* Save to Server */}
            <button 
              type="button" 
              onClick={handleSaveToAPI} 
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              <div className="text-left">
                <div>Simpan ke Server</div>
                <div className="text-xs opacity-80">Upload konfigurasi</div>
              </div>
            </button>

            {/* Update to Server */}
            <button 
              type="button" 
              onClick={handleUpdateToAPI} 
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2h-1.528A6 6 0 004 9.528V4z" />
                <path fillRule="evenodd" d="M8 10a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 108 10zm-2 4a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <div>Perbarui Data</div>
                <div className="text-xs opacity-80">Update konfigurasi</div>
              </div>
            </button>

            {/* Load from Server */}
            <button 
              type="button" 
              onClick={handleLoadFromAPI} 
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <div>Muat dari Server</div>
                <div className="text-xs opacity-80">Load konfigurasi</div>
              </div>
            </button>

            {/* View All Configs */}
            <button 
              type="button" 
              onClick={handleLoadAllConfigs} 
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 md:col-span-2 lg:col-span-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <div>Lihat Semua Konfigurasi</div>
                <div className="text-xs opacity-80">Daftar tersimpan</div>
              </div>
            </button>
          </div>
        </section>

        {/* Preview JSON - Collapsible */}
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
        </section>
      </div>
    </div>
  );
}

