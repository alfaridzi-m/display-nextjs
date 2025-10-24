'use client'

import { useState, useRef, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

// DIUBAH: Konstanta diperbarui sesuai permintaan Anda
const WILAYAH_AKTIF = ['P.AH.01','P.AH.02','P.AH.03','P.AH.04','P.AH.05','P.AH.06','P.AH.07','P.AH.08','P.AH.09'];
const view_point = [-3.424, 128.9];
const initial_zoom = 8;
const Your_location = [-3.69375, 128.17733];


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

const getColorForWaveCategory = (category) => {
  return KATEGORI_GELOMBANG[category]?.color || KATEGORI_GELOMBANG.unknown.color;
};

// PINDAH: Ekstrak logika fetching dan parsing data ke fungsi terpisah di luar komponen
async function fetchAndProcessForecasts(url = 'https://maritim.bmkg.go.id/marine-data/combine/forecast.json') {
    const weather_dict = { 1: 'Cerah', 2: 'Cerah Berawan', 3: 'Berawan', 4: 'Berawan Tebal', 5: 'Hujan Ringan', 6: 'Hujan Sedang', 7: 'Hujan Lebat', 8: 'Hujan Sangat Lebat', 9: 'Hujan Ekstrem', 10: 'Hujan Petir', 11: 'Kabut/Asap', 12: 'Udara Kabur', 13: 'Kabut', 14: 'Petir', '': 'unknown' };
    const wave_cat_dict = { 1: "Tenang", 2: "Rendah", 3: "Sedang", 4: "Tinggi", 5: "Sangat Tinggi", 6: "Ekstrem", 7: "Sangat Ekstrem", '': 'unknown' };
    const dir_dict = { 1: "Utara", 2: "Utara Timur Laut", 3: "Timur Laut", 4: "Timur Timur Laut", 5: "Timur", 6: "Timur Tenggara", 7: "Tenggara", 8: "Selatan Tenggara", 9: "Selatan", 10: "Selatan Barat Daya", 11: "Barat Daya", 12: "Barat Barat Daya", 13: "Barat", 14: "Barat Barat Laut", 15: "Barat Laut", 16: "Utara Barat Laut", '': 'unknown' };


    function parseFctCode(id, fct_code) {
        const parts = fct_code.split('|');
        const timeStr = parts[0];
        const year = new Date().getFullYear();
        const base = dayjs.utc(`${year}${timeStr}`, 'YYYYMMDDHH').toDate();
        const forecasts = parts.slice(1).map((part, idx) => {
            const row = part.split(',');
            const dt = new Date(base);
            const i = idx + 1;
            dt.setHours(dt.getHours() + (i <= 25 ? i - 1 : 24 + ((i - 25) * 3)));
            return { id, time: dt, weather: row[0] ? weather_dict[row[0]] : 'unknown', wave_cat: row[1] ? wave_cat_dict[row[1]] : 'unknown', wave_height: row[2] ? parseFloat(row[2]) : 0, wind_speed: row[3] ? parseInt(row[3]) : 0, wind_gust: row[4] ? parseInt(row[4]) : 0, wind_from: row[5] ? dir_dict[row[5]] : 'unknown' };
        });
        return forecasts;
    }

    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        const data = await resp.json();
        const lookup = {};
        const allTimes = new Set();
        const now = new Date();

        for (const area of data.area) {
            if (!WILAYAH_AKTIF.includes(area.id)) continue;
            const allForecasts = parseFctCode(area.id, area.fct_code);
            const futureForecasts = allForecasts.filter(f => f.time > now);

            if (futureForecasts.length > 0) {
                lookup[area.id] = futureForecasts;
                futureForecasts.forEach(f => allTimes.add(f.time.toISOString()));
            } else if (allForecasts.length > 0) {
                const lastForecast = allForecasts[allForecasts.length - 1];
                lookup[area.id] = [lastForecast];
                allTimes.add(lastForecast.time.toISOString());
            }
        }
        const sortedTimes = Array.from(allTimes).sort();
        return { forecastData: lookup, timeSteps: sortedTimes };
    } catch (err) {
        console.error('Error fetching or parsing forecasts:', err);
        throw err;
    }
}

// Ringkas prakiraan tiap 6 jam (berbasis UTC) per wilayah
function summarizeForecastsEvery6Hours(forecastData) {
    const summaries = {};
    const allBuckets = new Set();

    for (const regionId in forecastData) {
        const arr = forecastData[regionId] || [];
        summaries[regionId] = {};
        for (const f of arr) {
            const d = new Date(f.time);
            const bucketHour = Math.floor(d.getUTCHours() / 6) * 6; // 0,6,12,18
            const bucket = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), bucketHour));
            const key = bucket.toISOString();
            allBuckets.add(key);
            if (!summaries[regionId][key]) summaries[regionId][key] = { count: 0, maxWave: 0, categories: {} };
            const s = summaries[regionId][key];
            s.count += 1;
            s.maxWave = Math.max(s.maxWave, f.wave_height || 0);
            s.categories[f.wave_cat || 'unknown'] = (s.categories[f.wave_cat || 'unknown'] || 0) + 1;
        }
    }

    const timeSteps = Array.from(allBuckets).sort();
    return { summaries, timeSteps };
}

// Ambil waktu forecast terdekat terhadap bucket 6 jam
function getNearestTimeForBucket(bucketISO, allTimes) {
    if (!allTimes || allTimes.length === 0) return bucketISO;
    const target = new Date(bucketISO).getTime();
    let nearest = allTimes[0];
    let bestDiff = Math.abs(new Date(nearest).getTime() - target);
    for (const t of allTimes) {
        const d = Math.abs(new Date(t).getTime() - target);
        if (d < bestDiff) {
            bestDiff = d;
            nearest = t;
        }
    }
    return nearest;
}


const PerairanPage = ({ theme, isActive }) => {
    const [mapTitle] = useState('Peta Prakiraan Kategori GGGGG');
    const [forecastData, setForecastData] = useState(null);
    const [timeSteps, setTimeSteps] = useState([]);
    const [sixHourlySummary, setSixHourlySummary] = useState(null);
    const [sixHourlyTimeSteps, setSixHourlyTimeSteps] = useState([]);
    const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [geojson, setGeojson] = useState(null); // BARU: state untuk menyimpan geojson
    
    // Load saved settings from localStorage on mount - start with defaults to avoid hydration mismatch
    const [labelPosition, setLabelPosition] = useState('top-left');
    const [labelOffset, setLabelOffset] = useState({ lat: -0.05, lng: 0.05 });
    const [showLabelSettings, setShowLabelSettings] = useState(false); // Toggle settings panel
    const [individualPositions, setIndividualPositions] = useState({});
    const [connectorStartPositions, setConnectorStartPositions] = useState({}); // Store custom connector start points
    
    const [isDraggingMode, setIsDraggingMode] = useState(false); // Enable/disable dragging mode
    
    // Legend position state - start with default to avoid hydration mismatch
    const [legendPosition, setLegendPosition] = useState({ bottom: 8, right: 8 });
    const [legendSize, setLegendSize] = useState({ width: 'auto', height: 'auto' });
    
    const [isDraggingLegend, setIsDraggingLegend] = useState(false);
    const [isResizingLegend, setIsResizingLegend] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    const mapRef = useRef(null);
    const leafletRef = useRef(null); // Store Leaflet instance
    const featureLayersRef = useRef({});
    const mapContainerRef = useRef(null);
    const intervalRef = useRef(null);
    const labelLayersRef = useRef({});
    const connectorLinesRef = useRef({}); // Store connector lines
    const connectorStartMarkersRef = useRef({}); // Store connector start point markers
    const connectorEndMarkersRef = useRef({}); // Store connector end point markers
    const legendRef = useRef(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const resizeStartRef = useRef({ width: 0, height: 0, x: 0, y: 0 });

    // Weather icon mapping - moved outside for reuse
    const weatherIcons = {
        'Cerah': '☀️',
        'Cerah Berawan': '🌤️',
        'Berawan': '☁️',
        'Berawan Tebal': '☁️',
        'Hujan Ringan': '🌦️',
        'Hujan Sedang': '🌧️',
        'Hujan Lebat': '🌧️',
        'Hujan Sangat Lebat': '⛈️',
        'Hujan Ekstrem': '⛈️',
        'Hujan Petir': '⛈️',
        'Kabut/Asap': '🌫️',
        'Udara Kabur': '🌫️',
        'Kabut': '🌫️',
        'Petir': '⚡',
        'unknown': '❓'
    };

    // Helper function to create label HTML
    const createLabelHTML = useCallback((forecast) => {
        const weatherIcon = weatherIcons[forecast.weather] || '❓';
        
        return `
            <div style="
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(4px);
                border-radius: 8px;
                padding: 8px 10px;
                font-size: 11px;
                font-weight: 600;
                color: #1f2937;
                text-align: center;
                border: 2px solid ${KATEGORI_GELOMBANG[forecast.wave_cat]?.color || '#c1d4e3aa'};
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                white-space: nowrap;
                pointer-events: ${isDraggingMode ? 'auto' : 'none'};
                cursor: ${isDraggingMode ? 'move' : 'default'};
            ">
                <div style="font-size: 20px; margin-bottom: 2px;">
                    ${weatherIcon}
                </div>
                <div style="font-size: 16px; font-weight: 700; color: ${KATEGORI_GELOMBANG[forecast.wave_cat]?.color || '#c1d4e3aa'};">
                    ${forecast.wave_height}m
                </div>
                <div style="font-size: 13px; font-weight: 600; color: #374151; margin-top: 3px;">
                    ${forecast.wind_speed}kt
                </div>
                <div style="font-size: 10px; color: #6b7280; margin-top: 1px;">
                    ${forecast.wind_from}
                </div>
            </div>
        `;
    }, [isDraggingMode]);

    // Function to create/update connector line from polygon center to label
    const updateConnectorLine = useCallback((L, regionId, startPos, labelPos, waveColor) => {
        if (!mapRef.current) return;
        
        // Remove old line if exists
        if (connectorLinesRef.current[regionId]) {
            mapRef.current.removeLayer(connectorLinesRef.current[regionId]);
        }
        
        // Remove old start marker if exists
        if (connectorStartMarkersRef.current[regionId]) {
            mapRef.current.removeLayer(connectorStartMarkersRef.current[regionId]);
        }
        
        // Remove old end marker if exists
        if (connectorEndMarkersRef.current[regionId]) {
            mapRef.current.removeLayer(connectorEndMarkersRef.current[regionId]);
        }
        
        // Create new line with wave category color - solid and bold
        const lineColor = waveColor || '#3b82f6';
        const line = L.polyline([startPos, labelPos], {
            color: lineColor,
            weight: 3,
            opacity: 0.8,
            className: 'connector-line'
        });
        
        line.addTo(mapRef.current);
        connectorLinesRef.current[regionId] = line;
        
        // Create circle marker at the start point (center polygon)
        const endMarker = L.circleMarker(startPos, {
            radius: 5,
            fillColor: lineColor,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 1,
            interactive: false
        });
        
        endMarker.addTo(mapRef.current);
        connectorEndMarkersRef.current[regionId] = endMarker;
        
        // Create draggable marker at the start point (only in drag mode)
        if (isDraggingMode) {
            // Create a custom div icon for the connector point
            const connectorIcon = L.divIcon({
                html: `<div style="
                    width: 12px;
                    height: 12px;
                    background-color: ${lineColor};
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    cursor: move;
                "></div>`,
                className: '',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });
            
            const startMarker = L.marker(startPos, {
                icon: connectorIcon,
                draggable: true,
                autoPan: true
            });
            
            // Update line while dragging start point
            startMarker.on('drag', function(e) {
                const newStartPos = e.target.getLatLng();
                line.setLatLngs([newStartPos, labelPos]);
            });
            
            // Save new start position on drag end
            startMarker.on('dragend', function(e) {
                const newStartPos = e.target.getLatLng();
                setConnectorStartPositions(prev => ({
                    ...prev,
                    [regionId]: [newStartPos.lat, newStartPos.lng]
                }));
            });
            
            startMarker.addTo(mapRef.current);
            connectorStartMarkersRef.current[regionId] = startMarker;
        }
    }, [isDraggingMode]);

    // Function to create meteorological info label for each region
    const createMeteoLabel = useCallback((L, regionId, forecast, bounds, position = 'top-left', offset = { lat: -0.05, lng: 0.05 }, customPosition = null, layer = null) => {
        if (!forecast) return null;
        
        // Calculate polygon centroid (center of mass) for connector line
        let defaultCenter;
        if (layer && layer.getLatLngs) {
            // Calculate centroid of polygon
            const latlngs = layer.getLatLngs()[0]; // Get first ring of coordinates
            let latSum = 0, lngSum = 0, count = 0;
            latlngs.forEach(latlng => {
                latSum += latlng.lat;
                lngSum += latlng.lng;
                count++;
            });
            defaultCenter = [latSum / count, lngSum / count];
        } else {
            // Fallback to bounds center
            defaultCenter = bounds.getCenter();
        }
        
        // Use custom connector start position if available, otherwise use calculated center
        const startPos = connectorStartPositions[regionId] || defaultCenter;
        
        // Get wave category color
        const waveColor = getColorForWaveCategory(forecast.wave_cat);
        
        // Use custom position if available (for individually moved labels)
        if (customPosition) {
            const iconHtml = createLabelHTML(forecast);
            const icon = L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [90, 80],
                iconAnchor: [45, 40]
            });
            
            const marker = L.marker(customPosition, { 
                icon, 
                draggable: isDraggingMode,
                interactive: isDraggingMode
            });
            
            // Create connector line with wave color
            updateConnectorLine(L, regionId, startPos, customPosition, waveColor);
            
            if (isDraggingMode) {
                // Update line while dragging
                marker.on('drag', function(e) {
                    const newPos = e.target.getLatLng();
                    updateConnectorLine(L, regionId, startPos, [newPos.lat, newPos.lng], waveColor);
                });
                
                marker.on('dragend', function(e) {
                    const newPos = e.target.getLatLng();
                    setIndividualPositions(prev => ({
                        ...prev,
                        [regionId]: [newPos.lat, newPos.lng]
                    }));
                    updateConnectorLine(L, regionId, startPos, [newPos.lat, newPos.lng], waveColor);
                });
            }
            
            return marker;
        }
        
        // Get polygon bounds
        const northWest = bounds.getNorthWest();
        const southEast = bounds.getSouthEast();
        const boundsCenter = bounds.getCenter();
        
        // Calculate label position and anchor based on selected position
        let labelLatLng;
        let anchor;
        
        switch(position) {
            case 'top-left':
                labelLatLng = [northWest.lat + offset.lat, northWest.lng + offset.lng];
                anchor = [0, 0];
                break;
            case 'top-right':
                labelLatLng = [northWest.lat + offset.lat, southEast.lng + offset.lng];
                anchor = [90, 0];
                break;
            case 'bottom-left':
                labelLatLng = [southEast.lat + offset.lat, northWest.lng + offset.lng];
                anchor = [0, 80];
                break;
            case 'bottom-right':
                labelLatLng = [southEast.lat + offset.lat, southEast.lng + offset.lng];
                anchor = [90, 80];
                break;
            case 'center':
                labelLatLng = [boundsCenter.lat + offset.lat, boundsCenter.lng + offset.lng];
                anchor = [45, 40];
                break;
            case 'top-center':
                labelLatLng = [northWest.lat + offset.lat, boundsCenter.lng + offset.lng];
                anchor = [45, 0];
                break;
            case 'bottom-center':
                labelLatLng = [southEast.lat + offset.lat, boundsCenter.lng + offset.lng];
                anchor = [45, 80];
                break;
            case 'left-center':
                labelLatLng = [boundsCenter.lat + offset.lat, northWest.lng + offset.lng];
                anchor = [0, 40];
                break;
            case 'right-center':
                labelLatLng = [boundsCenter.lat + offset.lat, southEast.lng + offset.lng];
                anchor = [90, 40];
                break;
            default:
                labelLatLng = [northWest.lat + offset.lat, northWest.lng + offset.lng];
                anchor = [0, 0];
        }
        
        const iconHtml = createLabelHTML(forecast);
        
        const icon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [90, 80],
            iconAnchor: anchor
        });
        
        const marker = L.marker(labelLatLng, { 
            icon, 
            draggable: isDraggingMode,
            interactive: isDraggingMode
        });
        
        // Create connector line with wave color
        updateConnectorLine(L, regionId, startPos, labelLatLng, waveColor);
        
        if (isDraggingMode) {
            // Update line while dragging
            marker.on('drag', function(e) {
                const newPos = e.target.getLatLng();
                updateConnectorLine(L, regionId, startPos, [newPos.lat, newPos.lng], waveColor);
            });
            
            marker.on('dragend', function(e) {
                const newPos = e.target.getLatLng();
                setIndividualPositions(prev => ({
                    ...prev,
                    [regionId]: [newPos.lat, newPos.lng]
                }));
                updateConnectorLine(L, regionId, startPos, [newPos.lat, newPos.lng], waveColor);
            });
        }
        
        return marker;
    }, [isDraggingMode, createLabelHTML, setIndividualPositions, updateConnectorLine, connectorStartPositions]);

    // Tooltip styles removed since region ID center labels are no longer used

    const updateFeatureStyles = useCallback((timeISO) => {
        if (!sixHourlySummary || !forecastData || Object.keys(featureLayersRef.current).length === 0) return;
        if (!mapRef.current) return;

        const L = window.L;
        if (!L) return;

        for (const regionId in featureLayersRef.current) {
            const layer = featureLayersRef.current[regionId];
            let waveCategoryColor = KATEGORI_GELOMBANG.unknown.color;

            const regionBuckets = sixHourlySummary[regionId];
            if (regionBuckets && regionBuckets[timeISO]) {
                const bucket = regionBuckets[timeISO];
                let dominant = 'unknown';
                let max = 0;
                for (const cat in bucket.categories) {
                    if (bucket.categories[cat] > max) {
                        max = bucket.categories[cat];
                        dominant = cat;
                    }
                }
                waveCategoryColor = getColorForWaveCategory(dominant);
            }
            layer.setStyle({ fillColor: waveCategoryColor });

            // Update meteorological label
            const actualTimeISO = getNearestTimeForBucket(timeISO, timeSteps);
            const forecast = forecastData[regionId]?.find(f => f.time.toISOString() === actualTimeISO);
            
            if (forecast && labelLayersRef.current[regionId]) {
                // Remove old label and connector line
                mapRef.current.removeLayer(labelLayersRef.current[regionId]);
                if (connectorLinesRef.current[regionId]) {
                    mapRef.current.removeLayer(connectorLinesRef.current[regionId]);
                }
                if (connectorStartMarkersRef.current[regionId]) {
                    mapRef.current.removeLayer(connectorStartMarkersRef.current[regionId]);
                }
                if (connectorEndMarkersRef.current[regionId]) {
                    mapRef.current.removeLayer(connectorEndMarkersRef.current[regionId]);
                }
                
                // Create and add new label with current position settings or individual position
                const bounds = layer.getBounds();
                const customPos = individualPositions[regionId];
                const newLabel = createMeteoLabel(L, regionId, forecast, bounds, labelPosition, labelOffset, customPos, layer);
                if (newLabel) {
                    newLabel.addTo(mapRef.current);
                    labelLayersRef.current[regionId] = newLabel;
                }
            }
        }
    }, [sixHourlySummary, forecastData, timeSteps, createMeteoLabel, labelPosition, labelOffset, individualPositions]);

    // Load all settings from localStorage after hydration to avoid mismatch
    useEffect(() => {
        setIsHydrated(true);
        if (typeof window !== 'undefined') {
            const savedLabelPos = localStorage.getItem('labelPosition');
            if (savedLabelPos) {
                setLabelPosition(savedLabelPos);
            }
            
            const savedLabelOffset = localStorage.getItem('labelOffset');
            if (savedLabelOffset) {
                setLabelOffset(JSON.parse(savedLabelOffset));
            }
            
            const savedIndividualPos = localStorage.getItem('individualPositions');
            if (savedIndividualPos) {
                setIndividualPositions(JSON.parse(savedIndividualPos));
            }
            
            const savedLegendPos = localStorage.getItem('legendPosition');
            if (savedLegendPos) {
                setLegendPosition(JSON.parse(savedLegendPos));
            }
            
            const savedLegendSize = localStorage.getItem('legendSize');
            if (savedLegendSize) {
                setLegendSize(JSON.parse(savedLegendSize));
            }
            
            const savedConnectorStarts = localStorage.getItem('connectorStartPositions');
            if (savedConnectorStarts) {
                setConnectorStartPositions(JSON.parse(savedConnectorStarts));
            }
        }
    }, []);

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        const initializeMap = async () => {
            // Dynamically import Leaflet CSS
            await import('leaflet/dist/leaflet.css');
            const L = (await import('leaflet')).default;
            
            // Store Leaflet instance in ref for use in other functions
            leafletRef.current = L;

            // Check if the container already has a map instance and remove it
            if (mapContainerRef.current._leaflet_id) {
                mapContainerRef.current._leaflet_id = undefined;
            }

            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });
            
            // Custom red marker icon for user's location
            const redIcon = new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            // Create map with all interactions disabled
            mapRef.current = L.map(mapContainerRef.current, { 
                attributionControl: false,
                zoomControl: false,        // Remove zoom buttons
                dragging: false,           // Disable panning
                touchZoom: false,          // Disable touch zoom
                scrollWheelZoom: true,    // Disable scroll wheel zoom
                doubleClickZoom: false,    // Disable double-click zoom
                boxZoom: false,            // Disable box zoom
                keyboard: false,           // Disable keyboard navigation
                tap: false,                // Disable tap (mobile)
                zoomSnap: 0.1,             // Allow fractional zoom levels (0.1 increments)
                zoomDelta: 0.1             // Zoom in/out by 0.1 increments
            }).setView(view_point, initial_zoom);
            
            L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
                attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                ext: 'png'
            }).addTo(mapRef.current);
            L.marker(Your_location, { icon: redIcon }).addTo(mapRef.current)
                

            try {
                const geojsonData = await fetch("/wilpro.geojson").then(res => res.json());
                setGeojson(geojsonData); // DIUBAH: Simpan geojson ke state
                const { forecastData, timeSteps } = await fetchAndProcessForecasts();
                
                setForecastData(forecastData);
                setTimeSteps(timeSteps);

                // Bangun ringkasan 6 jam
                const { summaries, timeSteps: sixSteps } = summarizeForecastsEvery6Hours(forecastData);
                setSixHourlySummary(summaries);
                setSixHourlyTimeSteps(sixSteps);
                console.log("sixHourlyTimeSteps:", sixSteps);
                console.log("sixHourlySummary:", summaries);

                const geoJsonLayer = L.geoJSON(geojsonData, {
                    style: feature => ({
                        color: "#ffffffff",
                        weight: WILAYAH_AKTIF.includes(feature.properties.ID_MAR) ? 1.5 : 0.5,
                        opacity: 0.8,
                        fillColor: KATEGORI_GELOMBANG.unknown.color,
                        fillOpacity: 0.75,
                    }),
                    onEachFeature: (feature, layer) => {
                        const regionId = feature.properties.ID_MAR;
                        if (WILAYAH_AKTIF.includes(regionId)) {
                            featureLayersRef.current[regionId] = layer;
                            
                            // Add popup with region info on click
                            const regionName = feature.properties.perairan;
                            layer.bindPopup(`<strong>${regionName || regionId}</strong><br/><small>${regionId}</small>`);
                        }
                    }
                }).addTo(mapRef.current);

                // Initialize meteorological labels for active regions
                WILAYAH_AKTIF.forEach(regionId => {
                    const feature = geojsonData.features.find(f => f.properties.ID_MAR === regionId);
                    if (feature && featureLayersRef.current[regionId]) {
                        const layer = featureLayersRef.current[regionId];
                        const bounds = layer.getBounds();
                        const forecast = forecastData[regionId]?.[0];
                        const customPos = individualPositions[regionId];
                        const label = createMeteoLabel(L, regionId, forecast, bounds, labelPosition, labelOffset, customPos, layer);
                        if (label) {
                            label.addTo(mapRef.current);
                            labelLayersRef.current[regionId] = label;
                        }
                    }
                });

                setIsLoading(false);

            } catch (error) {
                console.error("Gagal menginisialisasi peta:", error);
                setIsLoading(false);
            }
        };

        initializeMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            // Clean up the container's Leaflet ID
            if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
                mapContainerRef.current._leaflet_id = undefined;
            }
        };
    }, []);

    // Fix gray area issue - force map to recalculate size after render
    useEffect(() => {
        if (mapRef.current && !isLoading) {
            // Multiple recalculations to ensure proper sizing
            const timeouts = [100, 300, 500, 1000];
            const timers = timeouts.map(delay => 
                setTimeout(() => {
                    if (mapRef.current) {
                        mapRef.current.invalidateSize();
                    }
                }, delay)
            );

            return () => {
                timers.forEach(timer => clearTimeout(timer));
            };
        }
    }, [isLoading]);

    // Handle window resize to fix gray area on fullscreen
    useEffect(() => {
        const handleResize = () => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        };

        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    useEffect(() => {
        if(mapRef.current && isActive) {
            console.log("PerairanPage is active - invalidating map size");
            setTimeout(() => {
                if (mapRef.current) {
                    mapRef.current.invalidateSize();
                }
            }, 150);
        }
    }, [isActive]);

    useEffect(() => {
        if (sixHourlyTimeSteps.length > 0) {
            const currentTime = sixHourlyTimeSteps[currentTimeIndex];
            updateFeatureStyles(currentTime);
        }
    }, [currentTimeIndex, sixHourlyTimeSteps, updateFeatureStyles]);

    // Update all labels when position or offset settings change
    useEffect(() => {
        if (!mapRef.current || !forecastData || !sixHourlyTimeSteps.length) return;
        
        const L = window.L;
        if (!L) return;

        // Re-create all labels with new position settings
        WILAYAH_AKTIF.forEach(regionId => {
            if (labelLayersRef.current[regionId]) {
                // Remove old label and connector line
                mapRef.current.removeLayer(labelLayersRef.current[regionId]);
                if (connectorLinesRef.current[regionId]) {
                    mapRef.current.removeLayer(connectorLinesRef.current[regionId]);
                }
                if (connectorStartMarkersRef.current[regionId]) {
                    mapRef.current.removeLayer(connectorStartMarkersRef.current[regionId]);
                }
                if (connectorEndMarkersRef.current[regionId]) {
                    mapRef.current.removeLayer(connectorEndMarkersRef.current[regionId]);
                }
                
                // Get current forecast
                const currentTime = sixHourlyTimeSteps[currentTimeIndex];
                const actualTimeISO = getNearestTimeForBucket(currentTime, timeSteps);
                const forecast = forecastData[regionId]?.find(f => f.time.toISOString() === actualTimeISO);
                
                if (forecast && featureLayersRef.current[regionId]) {
                    const layer = featureLayersRef.current[regionId];
                    const bounds = layer.getBounds();
                    const customPos = individualPositions[regionId];
                    const newLabel = createMeteoLabel(L, regionId, forecast, bounds, labelPosition, labelOffset, customPos, layer);
                    if (newLabel) {
                        newLabel.addTo(mapRef.current);
                        labelLayersRef.current[regionId] = newLabel;
                    }
                }
            }
        });
    }, [labelPosition, labelOffset, forecastData, sixHourlyTimeSteps, currentTimeIndex, timeSteps, createMeteoLabel, individualPositions]);

    // Save labelPosition to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('labelPosition', labelPosition);
        }
    }, [labelPosition]);

    // Save labelOffset to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('labelOffset', JSON.stringify(labelOffset));
        }
    }, [labelOffset]);

    // Save individualPositions to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('individualPositions', JSON.stringify(individualPositions));
        }
    }, [individualPositions]);
    
    // Save connectorStartPositions to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('connectorStartPositions', JSON.stringify(connectorStartPositions));
        }
    }, [connectorStartPositions]);
    
    // Save legendPosition to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('legendPosition', JSON.stringify(legendPosition));
        }
    }, [legendPosition]);
    
    // Save legendSize to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('legendSize', JSON.stringify(legendSize));
        }
    }, [legendSize]);
    
    // Handle legend dragging
    useEffect(() => {
        if (!isDraggingMode) return;
        
        const handleMouseMove = (e) => {
            if (!isDraggingLegend || !legendRef.current || !mapContainerRef.current) return;
            
            const containerRect = mapContainerRef.current.getBoundingClientRect();
            const legendRect = legendRef.current.getBoundingClientRect();
            
            // Calculate new position relative to container bottom-right
            const newRight = containerRect.right - e.clientX - dragOffsetRef.current.x;
            const newBottom = containerRect.bottom - e.clientY - dragOffsetRef.current.y;
            
            // Constrain within container bounds
            const maxRight = containerRect.width - legendRect.width;
            const maxBottom = containerRect.height - legendRect.height;
            
            setLegendPosition({
                right: Math.max(0, Math.min(newRight, maxRight)),
                bottom: Math.max(0, Math.min(newBottom, maxBottom))
            });
        };
        
        const handleMouseUp = () => {
            setIsDraggingLegend(false);
        };
        
        if (isDraggingLegend) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDraggingMode, isDraggingLegend]);
    
    // Handle legend resizing
    useEffect(() => {
        if (!isDraggingMode) return;
        
        const handleMouseMove = (e) => {
            if (!isResizingLegend) return;
            
            const deltaX = e.clientX - resizeStartRef.current.x;
            const deltaY = resizeStartRef.current.y - e.clientY; // Inverted because we're measuring from bottom
            
            const newWidth = Math.max(150, resizeStartRef.current.width + deltaX);
            const newHeight = Math.max(100, resizeStartRef.current.height + deltaY);
            
            setLegendSize({
                width: `${newWidth}px`,
                height: `${newHeight}px`
            });
        };
        
        const handleMouseUp = () => {
            setIsResizingLegend(false);
        };
        
        if (isResizingLegend) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDraggingMode, isResizingLegend]);

    // Pause animation when drag mode is activated
    useEffect(() => {
        if (isDraggingMode && isPlaying) {
            setIsPlaying(false);
        }
    }, [isDraggingMode]);

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setCurrentTimeIndex(prev => (prev + 1) % (sixHourlyTimeSteps.length || 1));
            }, 1500);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPlaying, sixHourlyTimeSteps]);

    // Autoplay when 6-hour steps are ready
    useEffect(() => {
        if (!isLoading && sixHourlyTimeSteps.length > 0) {
            setIsPlaying(true);
        }
    }, [isLoading, sixHourlyTimeSteps]);


    return (
        <>
        <div className={`flex flex-col h-[calc(100vh-8rem)] ${theme.glassCardClass} rounded-3xl overflow-hidden`}>
            <header className={`p-4 z-10 border-b ${theme.border} shrink-0`}>
                <h1 className={`text-xl font-bold text-center ${theme.text.primary}`}>{mapTitle}</h1>
            </header>

            <main className="flex-grow flex flex-col overflow-hidden">
                <div className="flex-1 p-4">
                    <div className="relative w-full h-full rounded-lg shadow-lg">
                        {/* Leaflet map fills the container */}
                        <div ref={mapContainerRef} className="absolute inset-0 rounded-lg" />
                        {/* Time overlay positioned on top of the map */}
                        {!isLoading && sixHourlyTimeSteps.length > 0 && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
                                <div className="max-w-md mx-auto bg-white/70 backdrop-blur p-2 rounded-lg shadow-inner">
                                    <div 
                                        className="flex items-center justify-between mb-2 cursor-pointer hover:bg-white/30 rounded px-1 transition-colors"
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        title={isPlaying ? 'Click to Pause' : 'Click to Play'}
                                    >
                                        <p className="text-xs font-semibold flex items-center gap-1">
                                            {isPlaying ? '▶' : '⏸'} Prakiraan Cuaca Jam
                                        </p>
                                    </div>
                                    <div className="flex w-full items-center justify-center gap-2">
                                        {sixHourlyTimeSteps.map((t, idx) => {
                                            const label = (idx + 1) * 6; // 6, 12, 18, ...
                                            const isActive = idx === currentTimeIndex;
                                            return (
                                                <span
                                                    key={t}
                                                    className={`px-2 py-1 rounded text-xs font-semibold ${isActive ? 'bg-blue-600 text-white' : ''} ${!isActive ? `${theme.text.primary} bg-white/50 dark:bg-white/10` : ''}`}
                                                >
                                                    {label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Legend overlay on top-right of map */}
                        <div 
                            ref={legendRef}
                            className="absolute z-[1000] pointer-events-auto"
                            style={{
                                bottom: `${legendPosition.bottom}px`,
                                right: `${legendPosition.right}px`,
                                cursor: isDraggingMode && !isResizingLegend ? 'move' : 'default',
                                width: legendSize.width,
                                height: legendSize.height,
                                minWidth: '150px',
                                minHeight: '100px'
                            }}
                            onMouseDown={(e) => {
                                if (!isDraggingMode) return;
                                // Only start dragging if not clicking on resize handle
                                if (e.target.classList.contains('resize-handle')) return;
                                e.preventDefault();
                                setIsDraggingLegend(true);
                                
                                const legendRect = legendRef.current.getBoundingClientRect();
                                dragOffsetRef.current = {
                                    x: legendRect.right - e.clientX,
                                    y: legendRect.bottom - e.clientY
                                };
                            }}
                        >
                            <div className={`relative bg-white/80 backdrop-blur rounded-md p-3 shadow border ${isDraggingMode ? 'border-blue-400 ring-2 ring-blue-300' : 'border-white/30 dark:border-white/10'} transition-all h-full flex flex-col`}>
                                <div className={`text-base font-semibold mb-2 ${theme.text.primary} flex items-center justify-between shrink-0`}>
                                    <span>Legenda Gelombang</span>
                                    {isDraggingMode && <span className="text-xl">📍</span>}
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
                                
                                {/* Resize handles - only show in drag mode */}
                                {isDraggingMode && (
                                    <>
                                        {/* Bottom-right corner resize handle */}
                                        <div
                                            className="resize-handle absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize bg-blue-500 hover:bg-blue-600 rounded-tl"
                                            style={{ borderBottomRightRadius: '0.375rem' }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setIsResizingLegend(true);
                                                const rect = legendRef.current.getBoundingClientRect();
                                                resizeStartRef.current = {
                                                    width: rect.width,
                                                    height: rect.height,
                                                    x: e.clientX,
                                                    y: e.clientY
                                                };
                                            }}
                                        >
                                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                                ⇲
                                            </div>
                                        </div>
                                        
                                        {/* Right edge resize handle */}
                                        <div
                                            className="resize-handle absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-16 cursor-ew-resize bg-blue-500 hover:bg-blue-600 rounded-l"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setIsResizingLegend(true);
                                                const rect = legendRef.current.getBoundingClientRect();
                                                resizeStartRef.current = {
                                                    width: rect.width,
                                                    height: rect.height,
                                                    x: e.clientX,
                                                    y: e.clientY
                                                };
                                            }}
                                        />
                                        
                                        {/* Bottom edge resize handle */}
                                        <div
                                            className="resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-2.5 cursor-ns-resize bg-blue-500 hover:bg-blue-600 rounded-t"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setIsResizingLegend(true);
                                                const rect = legendRef.current.getBoundingClientRect();
                                                resizeStartRef.current = {
                                                    width: rect.width,
                                                    height: rect.height,
                                                    x: e.clientX,
                                                    y: e.clientY
                                                };
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Label Position Settings - Moved to bottom-left */}
                        <div className="absolute bottom-2 left-2 z-[1000] pointer-events-auto group">
                            {/* Gear icon without background - always visible */}
                            {!showLabelSettings && (
                                <div 
                                    className="cursor-pointer transition-transform hover:scale-110"
                                    onClick={() => setShowLabelSettings(true)}
                                    title="Open Settings"
                                >
                                    <span className="text-2xl drop-shadow-lg">⚙️</span>
                                </div>
                            )}
                            
                            {/* Settings panel */}
                            {showLabelSettings && (
                                <div className="bg-white/90 backdrop-blur rounded-md p-3 shadow border border-white/30 dark:border-white/10 max-w-[220px]">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`text-xs font-semibold ${theme.text.primary} flex items-center gap-1`}>
                                            <span className="text-base">⚙️</span>
                                            <span>Pengaturan Label</span>
                                        </div>
                                        <button
                                            onClick={() => setShowLabelSettings(false)}
                                            className="text-sm px-1.5 py-0.5 rounded hover:bg-red-100 text-red-600 hover:text-red-700 font-bold transition-colors"
                                            title="Close Settings"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                
                                    <div className="space-y-2 pt-2 border-t border-gray-200">
                                        <div>
                                            <label className={`text-[10px] font-medium ${theme.text.primary} block mb-1`}>
                                                Posisi Preset:
                                            </label>
                                            <select 
                                                value={labelPosition} 
                                                onChange={(e) => setLabelPosition(e.target.value)}
                                                className="w-full text-xs px-2 py-1 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="top-left">Kiri Atas</option>
                                                <option value="top-center">Tengah Atas</option>
                                                <option value="top-right">Kanan Atas</option>
                                                <option value="left-center">Kiri Tengah</option>
                                                <option value="center">Tengah</option>
                                                <option value="right-center">Kanan Tengah</option>
                                                <option value="bottom-left">Kiri Bawah</option>
                                                <option value="bottom-center">Tengah Bawah</option>
                                                <option value="bottom-right">Kanan Bawah</option>
                                            </select>
                                        </div>
                                        
                                        <div className="border-t border-gray-200 pt-2 mt-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className={`text-[10px] font-medium ${theme.text.primary}`}>
                                                    Mode Drag Label:
                                                </label>
                                                <button
                                                    onClick={() => setIsDraggingMode(!isDraggingMode)}
                                                    className={`text-xs px-2 py-1 rounded font-semibold ${isDraggingMode ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                                                >
                                                    {isDraggingMode ? '✓ Aktif' : 'Nonaktif'}
                                                </button>
                                            </div>
                                            {isDraggingMode && (
                                                <div className="text-[9px] text-amber-600 bg-amber-50 p-1.5 rounded mb-2">
                                                    💡 Seret label, legenda, dan titik penghubung (bulat kecil) untuk memindahkan posisi
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setIndividualPositions({})}
                                                disabled={Object.keys(individualPositions).length === 0}
                                                className="w-full text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500 mb-1"
                                            >
                                                Reset Posisi Individual ({Object.keys(individualPositions).length})
                                            </button>
                                            <button
                                                onClick={() => setLegendPosition({ bottom: 8, right: 8 })}
                                                className="w-full text-xs px-2 py-1 rounded bg-orange-500 text-white hover:bg-orange-600 mb-1"
                                            >
                                                Reset Posisi Legenda
                                            </button>
                                            <button
                                                onClick={() => setLegendSize({ width: 'auto', height: 'auto' })}
                                                className="w-full text-xs px-2 py-1 rounded bg-teal-500 text-white hover:bg-teal-600 mb-1"
                                            >
                                                Reset Ukuran Legenda
                                            </button>
                                            <button
                                                onClick={() => setConnectorStartPositions({})}
                                                disabled={Object.keys(connectorStartPositions).length === 0}
                                                className="w-full text-xs px-2 py-1 rounded bg-purple-500 text-white hover:bg-purple-600 disabled:bg-gray-300 disabled:text-gray-500"
                                            >
                                                Reset Titik Garis ({Object.keys(connectorStartPositions).length})
                                            </button>
                                        </div>
                                        
                                        <div>
                                            <label className={`text-[10px] font-medium ${theme.text.primary} block mb-1`}>
                                                Offset Lintang (Lat): {labelOffset.lat.toFixed(3)}
                                            </label>
                                            <input
                                                type="range"
                                                min="-0.3"
                                                max="0.3"
                                                step="0.01"
                                                value={labelOffset.lat}
                                                onChange={(e) => setLabelOffset(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className={`text-[10px] font-medium ${theme.text.primary} block mb-1`}>
                                                Offset Bujur (Lng): {labelOffset.lng.toFixed(3)}
                                            </label>
                                            <input
                                                type="range"
                                                min="-0.3"
                                                max="0.3"
                                                step="0.01"
                                                value={labelOffset.lng}
                                                onChange={(e) => setLabelOffset(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                        
                                        <button
                                            onClick={() => setLabelOffset({ lat: -0.05, lng: 0.05 })}
                                            className="w-full text-xs px-2 py-1 rounded bg-gray-500 text-white hover:bg-gray-600"
                                        >
                                            Reset Offset
                                        </button>
                                        
                                        <div className="border-t border-gray-200 pt-2 mt-2">
                                            <button
                                                onClick={() => {
                                                    setLabelPosition('top-left');
                                                    setLabelOffset({ lat: -0.05, lng: 0.05 });
                                                    setIndividualPositions({});
                                                    setConnectorStartPositions({});
                                                    setLegendPosition({ bottom: 8, right: 8 });
                                                    setLegendSize({ width: 'auto', height: 'auto' });
                                                    if (typeof window !== 'undefined') {
                                                        localStorage.removeItem('labelPosition');
                                                        localStorage.removeItem('labelOffset');
                                                        localStorage.removeItem('individualPositions');
                                                        localStorage.removeItem('connectorStartPositions');
                                                        localStorage.removeItem('legendPosition');
                                                        localStorage.removeItem('legendSize');
                                                    }
                                                }}
                                                className="w-full text-xs px-2 py-1.5 rounded bg-purple-500 text-white hover:bg-purple-600 font-semibold"
                                            >
                                                🔄 Reset Semua Pengaturan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
        </>
    );
};

export default PerairanPage;


