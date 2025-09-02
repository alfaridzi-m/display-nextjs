// components/CoordinatePicker.js
'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// This is a common fix for the default marker icon issue with webpack.
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng); // Update state in the parent component
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Invalidate map size on initial render to prevent gray screen issue
  useEffect(() => {
    map.invalidateSize();
  }, [map]);


  return position === null ? null : <Marker position={position}></Marker>;
}

export default function CoordinatePicker({ value, onChange }) {
  const position = value ? { lat: value.lat, lng: value.lng } : null;
  const defaultCenter = { lat: -2.5489, lng: 118.0149 }; // Center of Indonesia

  return (
    <MapContainer
      center={position || defaultCenter}
      zoom={position ? 13 : 5}
      scrollWheelZoom={true}
      style={{ height: '300px', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} setPosition={onChange} />
    </MapContainer>
  );
}
