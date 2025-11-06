// hooks/useConfigForm.js
"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';

export const useConfigForm = (toast) => {
  const [formData, setFormData] = useState({
    id: "",
    displayTitle: "",
    viewPointLat: "",
    viewPointLng: "",
    initialZoom: 5,
    yourLocation: null,
    portIds: [],
    portEndPoints: [],
    wilayahAktif: [],
    labelPosition: "center",
    individualPositions: {},
    connectorStartPositions: {},
    legendPosition: { bottom: 8, right: 8 },
    legendSize: { width: "auto", height: "auto" },
  });

  const [idValidation, setIdValidation] = useState({ 
    isValid: true, 
    message: '', 
    isChecking: false 
  });

  const [portMapping, setPortMapping] = useState({});

  // Load port data
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

  // ID validation
  useEffect(() => {
    const checkIdAvailability = async () => {
      if (!formData.id) {
        setIdValidation({ isValid: true, message: '', isChecking: false });
        return;
      }

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
          setIdValidation({ 
            isValid: false, 
            message: 'ID sudah digunakan. Silakan pilih ID lain.', 
            isChecking: false,
            isWarning: false 
          });
        } else {
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
      
      const newConnectorPositions = { ...prev.connectorStartPositions };
      
      if (!exists && wilayahInfo?.geometry) {
        try {
          const geometry = wilayahInfo.geometry;
          if (geometry && geometry.coordinates) {
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
        delete newConnectorPositions[wilayahCode];
      }
      
      return {
        ...prev,
        wilayahAktif: exists ? current.filter((w) => w !== wilayahCode) : [...current, wilayahCode],
        connectorStartPositions: newConnectorPositions
      };
    });
  }, []);

  const handleLabelPositionChange = useCallback((wilayahId, position) => {
    setFormData((prev) => ({
      ...prev,
      individualPositions: {
        ...(prev.individualPositions || {}),
        [wilayahId]: position
      }
    }));
  }, []);

  const handleConnectorStartChange = useCallback((wilayahId, position) => {
    setFormData((prev) => ({
      ...prev,
      connectorStartPositions: {
        ...(prev.connectorStartPositions || {}),
        [wilayahId]: position
      }
    }));
  }, []);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Harap pilih file gambar (JPG, PNG, GIF, dll.)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.warning('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      if (base64String && typeof base64String === 'string') {
        try {
          localStorage.setItem('imageBackground', base64String);
          toast.success('Gambar berhasil disimpan!');
        } catch (error) {
          if (error.name === 'QuotaExceededError') {
            toast.error('Penyimpanan penuh. Gambar terlalu besar atau storage penuh.');
          } else {
            toast.error('Gagal menyimpan gambar: ' + error.message);
          }
        }
      }
    };
    reader.onerror = () => {
      toast.error('Gagal membaca file gambar');
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleRemoveImage = useCallback(() => {
    const confirm = window.confirm('Apakah Anda yakin ingin menghapus gambar latar belakang?');
    if (confirm) {
      localStorage.removeItem('imageBackground');
      toast.success('Gambar latar belakang berhasil dihapus!');
    }
  }, [toast]);

  const fillDummyLabelPositions = useCallback(() => {
    const dummyPositions = {};
    formData.wilayahAktif?.forEach((wilayahId, index) => {
      const basePos = formData.connectorStartPositions?.[wilayahId];
      if (basePos) {
        dummyPositions[wilayahId] = {
          lat: basePos.lat + (index % 2 === 0 ? 0.5 : -0.5),
          lng: basePos.lng + (index % 3 === 0 ? 0.8 : -0.8)
        };
      } else {
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

  const fillDummyConnectorPositions = useCallback(() => {
    const dummyPositions = {};
    formData.wilayahAktif?.forEach((wilayahId, index) => {
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
      },
    };
  }, [formData]);

  return {
    formData,
    setFormData,
    idValidation,
    portMapping,
    configObject,
    handlers: {
      handleInputChange,
      handleCoordinateChange,
      handleViewportChangeFromWilayah,
      handlePortClick,
      handleRemovePort,
      handleRemoveEndpoint,
      handleMoveToEndpoints,
      handleMoveToMain,
      handleWilayahClick,
      handleLabelPositionChange,
      handleConnectorStartChange,
      handleImageUpload,
      handleRemoveImage,
      fillDummyLabelPositions,
      fillDummyConnectorPositions
    }
  };
};
