// components/CoordinatePicker.js
'use client';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useState, useRef } from 'react';

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

// Component to render draggable labels for wilayah
function DraggableLabels({ wilayahGeoJson, selectedWilayahAktif, individualPositions, onLabelPositionChange, connectorStartPositions }) {
  const map = useMap();
  const labelsRef = useRef({});
  const connectorLinesRef = useRef({});
  const connectorEndMarkersRef = useRef({});

  useEffect(() => {
    if (!map || !wilayahGeoJson || !selectedWilayahAktif?.length) return;

    // Clear existing labels and connectors
    Object.values(labelsRef.current).forEach(label => {
      if (label) map.removeLayer(label);
    });
    Object.values(connectorLinesRef.current).forEach(line => {
      if (line) map.removeLayer(line);
    });
    Object.values(connectorEndMarkersRef.current).forEach(marker => {
      if (marker) map.removeLayer(marker);
    });
    labelsRef.current = {};
    connectorLinesRef.current = {};
    connectorEndMarkersRef.current = {};

    // Create labels for selected wilayah
    selectedWilayahAktif.forEach(wilayahId => {
      const feature = wilayahGeoJson.features?.find(f => f.properties?.ID_MAR === wilayahId);
      if (!feature) return;

      const bounds = L.geoJSON(feature).getBounds();
      const center = bounds.getCenter();
      
      // Get custom position or use default
      const customPos = individualPositions[wilayahId];
      let labelPos;
      
      if (customPos && Number.isFinite(customPos.lat) && Number.isFinite(customPos.lng)) {
        // Use lat/lng coordinates directly
        labelPos = L.latLng(customPos.lat, customPos.lng);
      } else {
        labelPos = center;
      }

      // Use custom connector start position if available, otherwise use center
      const connectorStart = connectorStartPositions?.[wilayahId] 
        ? L.latLng(connectorStartPositions[wilayahId].lat, connectorStartPositions[wilayahId].lng)
        : center;

      // Create draggable marker with custom HTML (weather info style)
      const labelIcon = L.divIcon({
        className: 'custom-label-icon',
        html: `
          <div style="
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(4px);
            border-radius: 8px;
            padding: 4px;
            font-size: 11px;
            font-weight: 600;
            color: #1f2937;
            border: 2px solid #3b82f6;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            cursor: move;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 100px;
          ">
            <!-- Row 1: Weather Icon -->
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
              <div style="font-size: 32px; line-height: 1;">
                ☀️
              </div>
            </div>

            <!-- Row 2: Wave Label -->
            <p style="font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 4px 0; width: 100%; background-color: #e5e7eb; text-align: center; border-radius: 2px; padding: 2px 0;">Gelombang</p>
            
            <!-- Row 3: Wave Height -->
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
              <div style="font-size: 18px; font-weight: 700; color: #3b82f6;">
                0.4 m
              </div>
            </div>
            
            <!-- Row 4: Wind Label -->
            <p style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 4px 0; width: 100%; background-color: #e5e7eb; text-align: center; border-radius: 2px; padding: 2px 0;">Angin</p>
            
            <!-- Row 5: Wind Direction and Speed -->
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 4px;">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                style="transform: rotate(180deg); transition: transform 0.3s;"
              >
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
              <span style="font-size: 14px; font-weight: 600; color: #374151;">5kt</span>
            </div>
          </div>
        `,
        iconSize: null,
        iconAnchor: [0, 0],
      });

      // Create connector line from start point to label
      const connectorLine = L.polyline([connectorStart, labelPos], {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8,
        className: 'connector-line'
      });
      connectorLine.addTo(map);
      connectorLinesRef.current[wilayahId] = connectorLine;

      // Create circle marker at the connector start point
      const endMarker = L.circleMarker(connectorStart, {
        radius: 5,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
        interactive: false
      });
      endMarker.addTo(map);
      connectorEndMarkersRef.current[wilayahId] = endMarker;

      const marker = L.marker(labelPos, {
        icon: labelIcon,
        draggable: true,
      });

      // Update connector line while dragging
      marker.on('drag', (e) => {
        const newPos = e.target.getLatLng();
        connectorLine.setLatLngs([connectorStart, newPos]);
      });

      marker.on('dragend', (e) => {
        const newLatLng = e.target.getLatLng();
        
        if (onLabelPositionChange) {
          onLabelPositionChange(wilayahId, { lat: newLatLng.lat, lng: newLatLng.lng });
        }
        
        // Update connector line after drag
        connectorLine.setLatLngs([connectorStart, newLatLng]);
      });

      marker.addTo(map);
      labelsRef.current[wilayahId] = marker;
    });

    return () => {
      Object.values(labelsRef.current).forEach(label => {
        if (label) map.removeLayer(label);
      });
      Object.values(connectorLinesRef.current).forEach(line => {
        if (line) map.removeLayer(line);
      });
      Object.values(connectorEndMarkersRef.current).forEach(marker => {
        if (marker) map.removeLayer(marker);
      });
    };
  }, [map, wilayahGeoJson, selectedWilayahAktif, individualPositions, onLabelPositionChange, connectorStartPositions]);

  return null;
}

// Component to render draggable connector start markers
function ConnectorStartMarkers({ wilayahGeoJson, selectedWilayahAktif, connectorStartPositions, onConnectorStartChange }) {
  const map = useMap();
  const markersRef = useRef({});

  useEffect(() => {
    if (!map || !wilayahGeoJson || !selectedWilayahAktif?.length) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      if (marker) map.removeLayer(marker);
    });
    markersRef.current = {};

    // Create connector start markers for selected wilayah
    selectedWilayahAktif.forEach(wilayahId => {
      const customPos = connectorStartPositions[wilayahId];
      if (!customPos || !Number.isFinite(customPos.lat) || !Number.isFinite(customPos.lng)) return;

      const markerIcon = L.divIcon({
        className: 'connector-start-icon',
        html: `
          <div style="
            width: 12px;
            height: 12px;
            background: #10b981;
            border: 2px solid white;
            border-radius: 50%;
            cursor: move;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          "></div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([customPos.lat, customPos.lng], {
        icon: markerIcon,
        draggable: true,
      });

      marker.on('dragend', (e) => {
        const newLatLng = e.target.getLatLng();
        if (onConnectorStartChange) {
          onConnectorStartChange(wilayahId, { lat: newLatLng.lat, lng: newLatLng.lng });
        }
      });

      marker.addTo(map);
      markersRef.current[wilayahId] = marker;
    });

    return () => {
      Object.values(markersRef.current).forEach(marker => {
        if (marker) map.removeLayer(marker);
      });
    };
  }, [map, wilayahGeoJson, selectedWilayahAktif, connectorStartPositions, onConnectorStartChange]);

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
  // New props for label configuration
  showLabels = false, // whether to show draggable labels
  individualPositions = {}, // individual label positions {wilayahId: {lat, lng}}
  onLabelPositionChange, // function(wilayahId, {lat, lng})
  connectorStartPositions = {}, // connector start positions {wilayahId: {lat, lng}}
  onConnectorStartChange, // function(wilayahId, {lat, lng})
  disableMapInteraction = false, // disable zoom and panning
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
        scrollWheelZoom={!disableMapInteraction}
        dragging={!disableMapInteraction}
        zoomControl={!disableMapInteraction}
        doubleClickZoom={!disableMapInteraction}
        touchZoom={!disableMapInteraction}
        boxZoom={!disableMapInteraction}
        keyboard={!disableMapInteraction}
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
                    fillColor: isSelected ? '#4293f7ff' : '#4b5668ff',
                    fillOpacity: 0.5,
                    weight: 3,
                    color: isSelected ? '#4293f7ff' : '#d1d5db',
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
                      properties: feature.properties,
                      geometry: feature.geometry
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
        
        {/* Draggable labels for wilayah */}
        {showLabels && (
          <DraggableLabels
            wilayahGeoJson={wilayahGeoJson}
            selectedWilayahAktif={selectedWilayahAktif}
            individualPositions={individualPositions}
            onLabelPositionChange={onLabelPositionChange}
            connectorStartPositions={connectorStartPositions}
          />
        )}
        
        {/* Draggable connector start markers */}
        {connectorStartPositions && Object.keys(connectorStartPositions).length > 0 && (
          <ConnectorStartMarkers
            wilayahGeoJson={wilayahGeoJson}
            selectedWilayahAktif={selectedWilayahAktif}
            connectorStartPositions={connectorStartPositions}
            onConnectorStartChange={onConnectorStartChange}
          />
        )}
      </MapContainer>
    </div>
  );
}
