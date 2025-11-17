'use client'

import { useState, useRef, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import { Navigation2 } from 'lucide-react';

dayjs.extend(utc);

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

// Convert wind direction to rotation angle (0 degrees = North)
const getWindDirectionAngle = (direction) => {
  const directionMap = {
    'Utara': 0,
    'Utara Timur Laut': 22.5,
    'Timur Laut': 45,
    'Timur Timur Laut': 67.5,
    'Timur': 90,
    'Timur Tenggara': 112.5,
    'Tenggara': 135,
    'Selatan Tenggara': 157.5,
    'Selatan': 180,
    'Selatan Barat Daya': 202.5,
    'Barat Daya': 225,
    'Barat Barat Daya': 247.5,
    'Barat': 270,
    'Barat Barat Laut': 292.5,
    'Barat Laut': 315,
    'Utara Barat Laut': 337.5,
    'unknown': 0
  };
  return directionMap[direction] || 0;
};

// PINDAH: Ekstrak logika fetching dan parsing data ke fungsi terpisah di luar komponen
async function fetchAndProcessForecasts(wilayahAktif, url = 'https://maritim.bmkg.go.id/marine-data/combine/forecast.json') {
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
            if (!wilayahAktif.includes(area.id)) continue;
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


const PerairanPage = ({ 
  theme, 
  isActive, 
  wilayahAktif, 
  viewPoint, 
  initialZoom, 
  yourLocation, 
  labelPosition = 'center', 
  labelOffset = { lat: -0.05, lng: 0.05 }, 
  individualPositions = {},
  connectorStartPositions = {},
  waveLegendPosition = { x: null, y: null }
}) => {
    const [mapTitle] = useState('Peta Prakiraan Cuaca Perairan');
    const [forecastData, setForecastData] = useState(null);
    const [timeSteps, setTimeSteps] = useState([]);
    const [sixHourlySummary, setSixHourlySummary] = useState(null);
    const [sixHourlyTimeSteps, setSixHourlyTimeSteps] = useState([]);
    const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [geojson, setGeojson] = useState(null); // BARU: state untuk menyimpan geojson

    const mapRef = useRef(null);
    const leafletRef = useRef(null); // Store Leaflet instance
    const featureLayersRef = useRef({});
    const mapContainerRef = useRef(null);
    const intervalRef = useRef(null);
    const labelLayersRef = useRef({});
    const connectorLinesRef = useRef({}); // Store connector lines
    const connectorEndMarkersRef = useRef({}); // Store connector end point markers (at polygon center)

    // Weather icon mapping - moved outside for reuse
    const weatherIcons = {
        'Cerah': '/icon/cerah.json',
        'Cerah Berawan': '/icon/cerah-berawan.json',
        'Berawan': '/icon/berawan.json',
        'Berawan Tebal': '/icon/berawan-tebal.json',
        'Hujan Ringan': '/icon/hujan-ringan.json',
        'Hujan Sedang': '/icon/hujan-sedang.json',
        'Hujan Lebat': '/icon/hujan-lebat.json',
        'Hujan Sangat Lebat': '/icon/hujan-lebat.json',
        'Hujan Ekstrem': '/icon/hujan-lebat.json',
        'Hujan Petir': '/icon/hujan-petir.json',
        'Kabut/Asap': '/icon/kabut.json',
        'Udara Kabur': '/icon/haze.json',
        'Kabut': '/icon/kabut.json',
        'Petir': '/icon/petir.json',
        'unknown': '/icon/berawan.json'
    };

    // Helper function to create label HTML
    const createLabelHTML = useCallback((forecast) => {
        const weatherIconPath = weatherIcons[forecast.weather] || weatherIcons['unknown'];
        const windAngle = getWindDirectionAngle(forecast.wind_from);
        const borderColor = KATEGORI_GELOMBANG[forecast.wave_cat]?.color || '#c1d4e3aa';
        const waveColor = KATEGORI_GELOMBANG[forecast.wave_cat]?.color || '#c1d4e3aa';
        
        return `
            <div class="bg-white/95 backdrop-blur rounded-lg px-1 py-1 text-[11px] font-semibold text-gray-800 shadow-md pointer-events-none cursor-default flex flex-col items-center min-w-[100px]" style="border: 2px solid ${borderColor};">
                <!-- Row 1: Weather Icon -->
                <div class="flex items-center justify-center mb-1">
                    <lottie-player
                        src="${weatherIconPath}"
                        background="transparent"
                        speed="1"
                        style="width: 60px; height: 60px;"
                        loop
                        autoplay
                    ></lottie-player>
                </div>

                
                <!-- Row 3: Teks wind -->
                <p class="text-[14px] font-semibold text-gray-700 mb-1 w-full text-center ">Angin</p>
                
                <!-- Row 4: Wind Direction and Speed -->
                <div class="flex items-center justify-center gap-2 mb-1">
                <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                class="transition-transform duration-300"
                style="transform: rotate(${windAngle+180}deg);"
                >
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                </svg>
                <span class="text-[14px] font-semibold text-gray-700">${forecast.wind_speed} kt</span>
                </div>
                <!-- Row 2: Wave Height -->
                <p class="text-[13px] font-semibold text-gray-700  w-full text-center border-t-2 border-gray-300">Gelombang</p>
                
                <!-- Row 2: Wave Height -->
                <div class="flex items-center justify-center">
                    <div class="text-lg font-bold">
                        ${forecast.wave_height} m
                    </div>
                </div>

                <p class="text-[13px] font-semibold text-white w-full text-center rounded-sm mb-1" style="background-color: ${waveColor};">${forecast.wave_cat}</p>
            </div>
        `;
    }, []);

    // Function to create/update connector line from polygon center to label
    const updateConnectorLine = useCallback((L, regionId, centerPos, labelPos, waveColor) => {
        if (!mapRef.current) return;
        
        // Remove old line if exists
        if (connectorLinesRef.current[regionId]) {
            mapRef.current.removeLayer(connectorLinesRef.current[regionId]);
        }
        
        // Remove old end marker if exists
        if (connectorEndMarkersRef.current[regionId]) {
            mapRef.current.removeLayer(connectorEndMarkersRef.current[regionId]);
        }
        
        // Create new line with wave category color - solid and bold
        const lineColor = '#dededeff';
        const line = L.polyline([centerPos, labelPos], {
            color: lineColor,
            weight: 4,
            opacity: 0.9,
            className: 'connector-line'
        });
        
        line.addTo(mapRef.current);
        connectorLinesRef.current[regionId] = line;
        
        // Create circle marker at the polygon center (connector point)
        const endMarker = L.circleMarker(centerPos, {
            radius: 5,
            fillColor: waveColor,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 1,
            interactive: false
        });
        
        endMarker.addTo(mapRef.current);
        connectorEndMarkersRef.current[regionId] = endMarker;
    }, []);

    // Function to create meteorological info label for each region
    const createMeteoLabel = useCallback((L, regionId, forecast, bounds, position = 'center', offset = { lat: -0.25, lng: 0.25 }, layer = null) => {
        if (!forecast) return null;
        
        // Calculate polygon centroid (center of mass) for connector line
        let centerPos;
        
        // Check if there's a custom connector start position for this region
        if (connectorStartPositions[regionId] && 
            connectorStartPositions[regionId].lat !== undefined && 
            connectorStartPositions[regionId].lng !== undefined) {
            // Use custom connector start position from configuration
            const customConnectorPos = connectorStartPositions[regionId];
            centerPos = [customConnectorPos.lat, customConnectorPos.lng];
        } else if (layer && layer.getLatLngs) {
            // Calculate centroid of polygon
            const latlngs = layer.getLatLngs()[0]; // Get first ring of coordinates
            let latSum = 0, lngSum = 0, count = 0;
            latlngs.forEach(latlng => {
                latSum += latlng.lat;
                lngSum += latlng.lng;
                count++;
            });
            centerPos = [latSum / count, lngSum / count];
        } else {
            // Fallback to bounds center
            centerPos = bounds.getCenter();
        }
        
        // Get wave category color
        const waveColor = getColorForWaveCategory(forecast.wave_cat);
        
        // Get polygon bounds
        const northWest = bounds.getNorthWest();
        const southEast = bounds.getSouthEast();
        const boundsCenter = bounds.getCenter();
        
        // Calculate label position and anchor based on selected position
        let labelLatLng;
        let anchor;
        
        // Check if there's an individual position for this region
        if (individualPositions[regionId] && individualPositions[regionId].lat !== undefined && individualPositions[regionId].lng !== undefined) {
            // Use lat/lng coordinates directly from configuration
            const customPos = individualPositions[regionId];
            labelLatLng = [customPos.lat, customPos.lng];
            anchor = [45, 40];
        } else {
            // Use default position logic
            switch(position) {
                case 'center':
                    labelLatLng = [boundsCenter.lat + offset.lat, boundsCenter.lng + offset.lng];
                    anchor = [45, 40];
                    break;
                default:
                    labelLatLng = [northWest.lat + offset.lat, northWest.lng + offset.lng];
                    anchor = [0, 0];
            }
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
            draggable: false,
            interactive: false
        });
        
        // Create connector line with wave color
        updateConnectorLine(L, regionId, centerPos, labelLatLng, waveColor);
        
        return marker;
    }, [createLabelHTML, updateConnectorLine, individualPositions, connectorStartPositions]);

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
                if (connectorEndMarkersRef.current[regionId]) {
                    mapRef.current.removeLayer(connectorEndMarkersRef.current[regionId]);
                }
                
                // Create and add new label with current position settings
                const bounds = layer.getBounds();
                const newLabel = createMeteoLabel(L, regionId, forecast, bounds, labelPosition, labelOffset, layer);
                if (newLabel) {
                    newLabel.addTo(mapRef.current);
                    labelLayersRef.current[regionId] = newLabel;
                }
            }
        }
    }, [sixHourlySummary, forecastData, timeSteps, createMeteoLabel, labelPosition, labelOffset]);

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        const initializeMap = async () => {
            // Load Lottie player script if not already loaded
            if (!document.querySelector('script[src*="lottie-player"]')) {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
                document.head.appendChild(script);
            }
            
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
            }).setView(viewPoint, initialZoom);
            
            L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
                attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                ext: 'png'
            }).addTo(mapRef.current);
            L.marker(yourLocation, { icon: redIcon }).addTo(mapRef.current);

            try {
                const geojsonData = await fetch("/wilpro.geojson").then(res => res.json());
                setGeojson(geojsonData); // DIUBAH: Simpan geojson ke state
                const { forecastData, timeSteps } = await fetchAndProcessForecasts(wilayahAktif);
                
                setForecastData(forecastData);
                setTimeSteps(timeSteps);

                // Bangun ringkasan 6 jam
                const { summaries, timeSteps: sixSteps } = summarizeForecastsEvery6Hours(forecastData);
                setSixHourlySummary(summaries);
                setSixHourlyTimeSteps(sixSteps);
               
                const geoJsonLayer = L.geoJSON(geojsonData, {
                    style: feature => ({
                        color: "#ffffffff",
                        weight: wilayahAktif.includes(feature.properties.ID_MAR) ? 1.5 : 0.5,
                        opacity: 0.8,
                        fillColor: KATEGORI_GELOMBANG.unknown.color,
                        fillOpacity: 0.75,
                    }),
                    onEachFeature: (feature, layer) => {
                        const regionId = feature.properties.ID_MAR;
                        if (wilayahAktif.includes(regionId)) {
                            featureLayersRef.current[regionId] = layer;
                            
                            // Add popup with region info on click
                            const regionName = feature.properties.perairan;
                            layer.bindPopup(`<strong>${regionName || regionId}</strong><br/><small>${regionId}</small>`);
                        }
                    }
                }).addTo(mapRef.current);

                // Initialize meteorological labels for active regions
                wilayahAktif.forEach(regionId => {
                    const feature = geojsonData.features.find(f => f.properties.ID_MAR === regionId);
                    if (feature && featureLayersRef.current[regionId]) {
                        const layer = featureLayersRef.current[regionId];
                        const bounds = layer.getBounds();
                        const forecast = forecastData[regionId]?.[0];
                        const label = createMeteoLabel(L, regionId, forecast, bounds, labelPosition, labelOffset, layer);
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
        wilayahAktif.forEach(regionId => {
            if (labelLayersRef.current[regionId]) {
                // Remove old label and connector line
                mapRef.current.removeLayer(labelLayersRef.current[regionId]);
                if (connectorLinesRef.current[regionId]) {
                    mapRef.current.removeLayer(connectorLinesRef.current[regionId]);
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
                    const newLabel = createMeteoLabel(L, regionId, forecast, bounds, labelPosition, labelOffset, layer);
                    if (newLabel) {
                        newLabel.addTo(mapRef.current);
                        labelLayersRef.current[regionId] = newLabel;
                    }
                }
            }
        });
    }, [labelPosition, labelOffset, forecastData, sixHourlyTimeSteps, currentTimeIndex, timeSteps, createMeteoLabel, wilayahAktif]);

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
                        <div className="absolute bottom-2 right-2 z-[1000] pointer-events-auto">
                            <div className="bg-white/80 backdrop-blur rounded-md p-3 shadow border border-white/30 dark:border-white/10">
                                <div className={`text-base font-semibold mb-2 ${theme.text.primary}`}>
                                    Legenda Gelombang
                                </div>
                                <ul className="space-y-2">
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
                </div>
            </main>
        </div>
        </>
    );
};

export default PerairanPage;


