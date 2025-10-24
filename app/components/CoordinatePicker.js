// components/CoordinatePicker.js
'use client';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';

// This is a common fix for the default marker icon issue with webpack.
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

function MapEventBridge({ onPick, onViewportChange, enableLocationPick }) {
  const map = useMapEvents({
    click(e) {
      // Set location when clicking on the map
      if (enableLocationPick && onPick) {
        // Check if we're clicking on the map tiles (not a marker or other interactive element)
        const target = e.originalEvent.target;
        const isMapTile = target.tagName === 'IMG' || target.classList.contains('leaflet-container') || target.classList.contains('leaflet-tile-pane');
        
        if (isMapTile || !target.closest('.leaflet-marker-icon')) {
          onPick(e.latlng);
          map.flyTo(e.latlng, map.getZoom());
        }
      }
    },
    moveend() {
      if (onViewportChange) {
        const center = map.getCenter();
        onViewportChange({ center: { lat: center.lat, lng: center.lng }, zoom: map.getZoom() });
      }
    },
    zoomend() {
      if (onViewportChange) {
        const center = map.getCenter();
        onViewportChange({ center: { lat: center.lat, lng: center.lng }, zoom: map.getZoom() });
      }
    },
  });

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  return null;
}

function SyncView({ viewPoint, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (viewPoint && Number.isFinite(viewPoint[0]) && Number.isFinite(viewPoint[1])) {
      const z = Number.isFinite(zoom) ? zoom : map.getZoom();
      map.setView({ lat: viewPoint[0], lng: viewPoint[1] }, z, { animate: false });
    }
  }, [map, viewPoint?.[0], viewPoint?.[1], zoom]);
  return null;
}

export default function CoordinatePicker({
  value, // {lat,lng} your location marker
  onChange, // function(latlng)
  viewPoint, // [lat,lng]
  zoom, // number
  onViewportChange, // function({center:{lat,lng}, zoom})
  selectedPortIds = [], // array of strings matching properties.code
  selectedPortEndPoints = [], // array of strings for endpoint ports (green)
  portsGeoJsonUrl = '/pelabuhan.geojson',
  className = '', // wrapper class
  selectedWilayahAktif = [], // array of strings, e.g., ['P.AH.01']
  onPortClick, // function(portCode) - toggle port selection
  onWilayahClick, // function(wilayahCode, wilayahInfo) - toggle wilayah selection with info
  showPorts = true, // whether to show port markers
  showWilayah = true, // whether to show wilayah polygons
  zoomSnap = 0.1, // zoom snap precision
  zoomDelta = 0.1, // zoom delta for controls
}) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const position = value ? { lat: value.lat, lng: value.lng } : null;
  const defaultCenter = { lat: -2.5489, lng: 118.0149 }; // Center of Indonesia

  const initialCenter = useMemo(() => {
    if (viewPoint && Number.isFinite(viewPoint[0]) && Number.isFinite(viewPoint[1])) {
      return { lat: viewPoint[0], lng: viewPoint[1] };
    }
    return position || defaultCenter;
  }, [viewPoint?.[0], viewPoint?.[1], position]);

  const initialZoom = useMemo(() => {
    if (Number.isFinite(zoom)) return zoom;
    return position ? 13 : 5;
  }, [zoom, position]);

  const [ports, setPorts] = useState([]);
  const [wilayahGeoJson, setWilayahGeoJson] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(portsGeoJsonUrl, { signal: controller.signal })
      .then((r) => r.json())
      .then((geo) => {
        const list = Array.isArray(geo.features) ? geo.features : [];
        setPorts(list);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          // ignore other load errors gracefully
        }
      });
    return () => controller.abort();
  }, [portsGeoJsonUrl]);

  // Load wilayah geojson
  useEffect(() => {
    const controller = new AbortController();
    fetch('/wilpro.geojson', { signal: controller.signal })
      .then((r) => r.json())
      .then((geo) => {
        // Use ID_MAR directly as wilayahCode
        if (geo.features) {
          geo.features.forEach(f => {
            const props = f.properties || {};
            // Use ID_MAR as the wilayahCode directly
            if (typeof props.ID_MAR === 'string') {
              props.wilayahCode = props.ID_MAR;
            }
            f.properties = props;
          });
        }
        setWilayahGeoJson(geo);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          // ignore other load errors
        }
      });
    return () => controller.abort();
  }, []);

  // Memoized sets for faster lookups
  const selectedIdsSet = useMemo(() => new Set(selectedPortIds), [selectedPortIds]);
  const endpointIdsSet = useMemo(() => new Set(selectedPortEndPoints), [selectedPortEndPoints]);

  // Reusable lightweight icons to avoid recreating per marker
  const icons = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const mk = (fill, stroke) =>
      L.divIcon({
        html: `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${fill};border:2px solid ${stroke};box-shadow:0 0 0 2px rgba(0,0,0,0.2);"></span>`,
        className: 'custom-pin',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -9],
      });
    return {
      main: mk('#3b82f6', '#1d4ed8'),
      endpoint: mk('#10b981', '#059669'),
      default: mk('#6b7280', '#374151'),
    };
  }, []);

  if (!isMounted) {
    return (
      <div className={className} style={{ width: '100%' }}>
        <div style={{ height: '100%', width: '100%', borderRadius: '0.5rem', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#9ca3af' }}>Memuat peta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        zoomSnap={zoomSnap}
        zoomDelta={zoomDelta}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />

        {/* bridge clicks/moves */}
        <MapEventBridge onPick={onChange} onViewportChange={onViewportChange} enableLocationPick={!!onChange} />
        {/* sync external view props into map */}
        <SyncView viewPoint={viewPoint} zoom={zoom} />

        {/* your location marker */}
        {position ? (
          <Marker 
            position={position}
            title="Your Location"
          />
        ) : null}

        {/* selected ports */}
        {/* Wilayah regions as polygons */}
        {showWilayah && wilayahGeoJson && (
          <GeoJSON
            key={JSON.stringify(selectedWilayahAktif)} // Re-render when selection changes
            data={wilayahGeoJson}
            style={(feature) => {
              const wilayahCode = feature.properties?.wilayahCode;
              const isSelected = selectedWilayahAktif.includes(wilayahCode);
              return {
                fillColor: isSelected ? '#3b82f6' : '#6b7280',
                fillOpacity: isSelected ? 0.35 : 0.15,
                color: isSelected ? '#3b82f6' : '#9ca3af',
                weight: isSelected ? 2 : 1,
                opacity: 0.8,
              };
            }}
            onEachFeature={(feature, layer) => {
              const wilayahCode = feature.properties?.wilayahCode;
              const perairan = feature.properties?.perairan;
              const isSelected = selectedWilayahAktif.includes(wilayahCode);
              
              if (wilayahCode) {
                layer.bindTooltip(`${wilayahCode}<br/>${perairan || ''}`, {
                  permanent: false,
                  direction: 'top',
                  offset: [10, -10],
                  className: 'wilayah-tooltip'
                });
                
                // Hover effects
                layer.on('mouseover', (e) => {
                  const targetLayer = e.target;
                  targetLayer.setStyle({
                    fillColor: isSelected ? '#60a5fa' : '#9ca3af',
                    fillOpacity: 0.5,
                    weight: 3,
                    color: isSelected ? '#60a5fa' : '#d1d5db',
                  });
                });
                
                layer.on('mouseout', (e) => {
                  const targetLayer = e.target;
                  targetLayer.setStyle({
                    fillColor: isSelected ? '#3b82f6' : '#6b7280',
                    fillOpacity: isSelected ? 0.35 : 0.15,
                    color: isSelected ? '#3b82f6' : '#9ca3af',
                    weight: isSelected ? 2 : 1,
                  });
                });
                
                layer.on('click', (e) => {
                  L.DomEvent.stopPropagation(e);
                  if (onWilayahClick) {
                    const wilayahInfo = {
                      code: wilayahCode,
                      name: perairan || wilayahCode,
                      properties: feature.properties
                    };
                    onWilayahClick(wilayahCode, wilayahInfo);
                  }
                });
              }
            }}
          />
        )}

        {/* All ports as clickable markers */}
        {showPorts && ports.map((f) => {
          const coords = f?.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) return null;
          const lng = Number(coords[0]);
          const lat = Number(coords[1]);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const code = f.properties?.code;
          const location = f.properties?.location || code;
          const isSelected = selectedIdsSet.has(code);
          const isEndpoint = endpointIdsSet.has(code);

          const icon = isSelected
            ? icons.main
            : isEndpoint
            ? icons.endpoint
            : icons.default;
          
          return (
            <Marker
              key={code}
              position={{ lat, lng }}
              title={`${code} - ${location}`}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onPortClick) onPortClick(code);
                }
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
