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

async function fetchAndProcessForecasts(wilayahAktif, baseUrl = 'https://maritim.bmkg.go.id/marine-data/perairan/') {
    try {
        const lookup = {};
        const allTimes = new Set();
        const now = new Date();

        // Fetch data for each region in wilayahAktif
        for (const regionId of wilayahAktif) {
            const url = `${baseUrl}${regionId}.json`;
            
            try {
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.warn(`Failed to fetch data for region ${regionId}: ${resp.status}`);
                    continue;
                }
                const data = await resp.json();
                
                // Combine forecast_day1 (hourly) and forecast_day2-4 (3-hourly)
                const allForecasts = [
                    ...(data.forecast_day1 || []),
                    ...(data['forecast_day2-4'] || [])
                ];
                
                // Transform the data to match our expected format
                const transformedForecasts = allForecasts.map(f => ({
                    id: data.code || regionId,
                    time: new Date(f.time),
                    weather: f.weather || 'unknown',
                    wave_cat: f.wave_cat || 'unknown',
                    wave_height: f.wave_height || 0,
                    wind_speed: f.wind_speed || 0,
                    wind_gust: f.wind_gust || 0,
                    wind_from: f.wind_from || 'unknown',
                    temp_avg: f.temp_avg,
                    rh_avg: f.rh_avg,
                    current_to: f.current_to,
                    current_speed: f.current_speed
                }));
                
                // Calculate date range: start from beginning of today (00:00 UTC), not current time
                const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                const maxDate = new Date(today);
                maxDate.setUTCDate(maxDate.getUTCDate() + 3); // End of day after tomorrow
                
                // Filter for forecasts from today 00:00 UTC through the next 3 days
                const relevantForecasts = transformedForecasts.filter(f => f.time >= today && f.time < maxDate);

                if (relevantForecasts.length > 0) {
                    lookup[regionId] = relevantForecasts;
                    relevantForecasts.forEach(f => allTimes.add(f.time.toISOString()));
                    console.log(`${regionId}: Loaded ${relevantForecasts.length} forecasts from ${relevantForecasts[0].time.toISOString()} to ${relevantForecasts[relevantForecasts.length-1].time.toISOString()}`);
                } else if (transformedForecasts.length > 0) {
                    // If no relevant forecasts, use all available
                    lookup[regionId] = transformedForecasts;
                    transformedForecasts.forEach(f => allTimes.add(f.time.toISOString()));
                    console.log(`${regionId}: Using all ${transformedForecasts.length} available forecasts`);
                }
            } catch (err) {
                console.error(`Error fetching data for region ${regionId}:`, err);
            }
        }
        
        const sortedTimes = Array.from(allTimes).sort();
        return { forecastData: lookup, timeSteps: sortedTimes };
    } catch (err) {
        console.error('Error fetching or parsing forecasts:', err);
        throw err;
    }
}

// Ringkas prakiraan per 6 jam dengan aturan baru:
// Day 0 (Hari ini): 00 UTC = point data only, 06/12/18 UTC = 6-hour window
// Day 1 & 2 (Besok & Lusa): All timesteps (00/06/12/18 UTC) = 6-hour window
function summarizeForecastsEvery6Hours(forecastData) {
    const summaries = {};
    const allBuckets = new Set();
    
    // Use UTC-based date calculations
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setUTCDate(dayAfterTomorrow.getUTCDate() + 2);
    
    // Define 6-hour timesteps for each day: 00, 06, 12, 18 UTC
    const timesteps = [0, 6, 12, 18];
    const days = [
        { date: today, label: 'today' },
        { date: tomorrow, label: 'tomorrow' },
        { date: dayAfterTomorrow, label: 'dayAfterTomorrow' }
    ];
    
    for (const regionId in forecastData) {
        const arr = forecastData[regionId] || [];
        summaries[regionId] = {};
        
        // Process each day and timestep
        for (const { date, label } of days) {
            for (const hour of timesteps) {
                const bucketTime = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, 0, 0));
                const key = bucketTime.toISOString();
                allBuckets.add(key);
                
                summaries[regionId][key] = { count: 0, maxWave: 0, categories: {}, forecasts: [] };
                
                // Determine which forecasts to include based on rules
                let forecastsToInclude = [];
                
                if (label === 'today' && hour === 0) {
                    // Day 0, 00 UTC: use point data only (exact 00 UTC record)
                    const exactMatch = arr.find(f => {
                        const fTime = new Date(f.time);
                        return fTime.getUTCFullYear() === date.getUTCFullYear() &&
                               fTime.getUTCMonth() === date.getUTCMonth() &&
                               fTime.getUTCDate() === date.getUTCDate() &&
                               fTime.getUTCHours() === 0;
                    });
                    if (exactMatch) {
                        forecastsToInclude.push(exactMatch);
                    }
                } else {
                    // All other cases: 6-hour summary window
                    const windowStart = new Date(bucketTime);
                    windowStart.setUTCHours(windowStart.getUTCHours() - 6);
                    
                    // For 6-hour window: include forecasts from (bucketTime - 6 hours) up to and including bucketTime
                    forecastsToInclude = arr.filter(f => {
                        const fTime = new Date(f.time);
                        return fTime > windowStart && fTime <= bucketTime;
                    });
                    
                    // Debug logging for empty buckets
                    if (forecastsToInclude.length === 0) {
                        console.log(`No forecasts found for ${regionId} at ${key}. Window: ${windowStart.toISOString()} to ${bucketTime.toISOString()}`);
                        console.log(`Available times:`, arr.map(f => new Date(f.time).toISOString()).slice(0, 5));
                    }
                }
                
                // Aggregate the forecasts
                const s = summaries[regionId][key];
                for (const f of forecastsToInclude) {
                    s.count += 1;
                    s.maxWave = Math.max(s.maxWave, f.wave_height || 0);
                    s.categories[f.wave_cat || 'unknown'] = (s.categories[f.wave_cat || 'unknown'] || 0) + 1;
                    s.forecasts.push(f);
                }
                
                // Log summary for debugging
                if (forecastsToInclude.length > 0) {
                    const bucketDate = new Date(key);
                    console.log(`${regionId} ${bucketDate.getUTCDate()}/${bucketDate.getUTCMonth()+1} ${bucketDate.getUTCHours()}:00 - ${forecastsToInclude.length} forecasts, dominant: ${Object.keys(s.categories).reduce((a, b) => s.categories[a] > s.categories[b] ? a : b, 'unknown')}, maxWave: ${s.maxWave}m`);
                }
            }
        }
    }
    
    const timeSteps = Array.from(allBuckets).sort();
    console.log(`Created ${timeSteps.length} timesteps for ${Object.keys(summaries).length} regions`);
    return { summaries, timeSteps };
}

// Ambil waktu forecast yang representatif untuk bucket timestep
// Untuk timestep dengan 6-hour window, ambil waktu di tengah window (3 jam sebelum bucket time)
// Untuk point data (today 00 UTC), gunakan exact time
function getNearestTimeForBucket(bucketISO, allTimes, forecastData, regionId) {
    if (!allTimes || allTimes.length === 0) return bucketISO;
    
    const bucketDate = new Date(bucketISO);
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    // Check if this is today 00 UTC (point data only)
    const isToday00UTC = bucketDate.getUTCDate() === today.getUTCDate() &&
                         bucketDate.getUTCMonth() === today.getUTCMonth() &&
                         bucketDate.getUTCFullYear() === today.getUTCFullYear() &&
                         bucketDate.getUTCHours() === 0;
    
    if (isToday00UTC) {
        // For today 00 UTC, use exact 00 UTC time
        return bucketISO;
    } else {
        // For 6-hour windows, use middle of the window (3 hours before bucket time)
        const target = new Date(bucketDate);
        target.setUTCHours(target.getUTCHours() - 3);
        const targetTime = target.getTime();
        
        // Find the closest forecast time to the middle of the window
        let nearest = allTimes[0];
        let bestDiff = Math.abs(new Date(nearest).getTime() - targetTime);
        
        for (const t of allTimes) {
            const forecastTime = new Date(t).getTime();
            const d = Math.abs(forecastTime - targetTime);
            if (d < bestDiff) {
                bestDiff = d;
                nearest = t;
            }
        }
        return nearest;
    }
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

                <p class="text-[13px] font-semibold text-black w-full text-center rounded-sm mb-1" style="background-color: ${waveColor};">${forecast.wave_cat}</p>
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

        // Use requestAnimationFrame to ensure smooth updates
        requestAnimationFrame(() => {
            for (const regionId in featureLayersRef.current) {
                const layer = featureLayersRef.current[regionId];
                let waveCategoryColor = KATEGORI_GELOMBANG.unknown.color;
                let displayForecast = null;

                const regionBuckets = sixHourlySummary[regionId];
                if (regionBuckets && regionBuckets[timeISO]) {
                    const bucket = regionBuckets[timeISO];
                    
                    // Determine dominant wave category
                    let dominant = 'unknown';
                    let max = 0;
                    for (const cat in bucket.categories) {
                        if (bucket.categories[cat] > max) {
                            max = bucket.categories[cat];
                            dominant = cat;
                        }
                    }
                    waveCategoryColor = getColorForWaveCategory(dominant);
                    
                    // For display, use the forecast with MAXIMUM wave height
                    // This ensures both polygon color and label show the most significant condition
                    if (bucket.forecasts && bucket.forecasts.length > 0) {
                        // Use the forecast with the maximum wave height as representative
                        displayForecast = bucket.forecasts.reduce((maxF, f) => 
                            (f.wave_height > maxF.wave_height ? f : maxF), 
                            bucket.forecasts[0]
                        );
                        
                        // Update polygon color to match the max wave height forecast's category
                        // This ensures polygon and label colors are consistent
                        waveCategoryColor = getColorForWaveCategory(displayForecast.wave_cat);
                    } else {
                        console.warn(`Empty bucket for ${regionId} at ${timeISO}`);
                    }
                } else {
                    console.warn(`No bucket found for ${regionId} at ${timeISO}`);
                }
                
                // Fallback: find nearest forecast from raw data if summary doesn't have data
                if (!displayForecast && forecastData[regionId]) {
                    const targetTime = new Date(timeISO);
                    displayForecast = forecastData[regionId].reduce((nearest, f) => {
                        const nearestDiff = Math.abs(new Date(nearest.time) - targetTime);
                        const fDiff = Math.abs(new Date(f.time) - targetTime);
                        return fDiff < nearestDiff ? f : nearest;
                    }, forecastData[regionId][0]);
                }
                
                layer.setStyle({ fillColor: waveCategoryColor });

                // Update meteorological label
                if (displayForecast && labelLayersRef.current[regionId]) {
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
                    const newLabel = createMeteoLabel(L, regionId, displayForecast, bounds, labelPosition, labelOffset, layer);
                    if (newLabel) {
                        newLabel.addTo(mapRef.current);
                        labelLayersRef.current[regionId] = newLabel;
                    }
                }
            }
        });
    }, [sixHourlySummary, forecastData, createMeteoLabel, labelPosition, labelOffset]);

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
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; CARTO & OpenStreetMap contributors'
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

                // Initialize meteorological labels for active regions with first timestep data
                if (sixSteps.length > 0) {
                    const firstTimeStep = sixSteps[0];
                    wilayahAktif.forEach(regionId => {
                        const feature = geojsonData.features.find(f => f.properties.ID_MAR === regionId);
                        if (feature && featureLayersRef.current[regionId]) {
                            const layer = featureLayersRef.current[regionId];
                            const bounds = layer.getBounds();
                            
                            // Get forecast from first summary bucket
                            let displayForecast = null;
                            if (summaries[regionId] && summaries[regionId][firstTimeStep]) {
                                const bucket = summaries[regionId][firstTimeStep];
                                if (bucket.forecasts && bucket.forecasts.length > 0) {
                                    displayForecast = bucket.forecasts.reduce((max, f) => 
                                        (f.wave_height > max.wave_height ? f : max), 
                                        bucket.forecasts[0]
                                    );
                                }
                            }
                            
                            // Fallback: use first available forecast if summary doesn't have data
                            if (!displayForecast && forecastData[regionId] && forecastData[regionId].length > 0) {
                                displayForecast = forecastData[regionId][0];
                            }
                            
                            if (displayForecast) {
                                const label = createMeteoLabel(L, regionId, displayForecast, bounds, labelPosition, labelOffset, layer);
                                if (label) {
                                    label.addTo(mapRef.current);
                                    labelLayersRef.current[regionId] = label;
                                }
                            }
                        }
                    });
                }

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
        if (!mapRef.current || !sixHourlySummary || !sixHourlyTimeSteps.length) return;
        
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
                
                // Get current forecast from summary bucket
                const currentTime = sixHourlyTimeSteps[currentTimeIndex];
                const regionBuckets = sixHourlySummary[regionId];
                let displayForecast = null;
                
                if (regionBuckets && regionBuckets[currentTime]) {
                    const bucket = regionBuckets[currentTime];
                    if (bucket.forecasts && bucket.forecasts.length > 0) {
                        displayForecast = bucket.forecasts.reduce((max, f) => 
                            (f.wave_height > max.wave_height ? f : max), 
                            bucket.forecasts[0]
                        );
                    }
                }
                
                // Fallback: use nearest forecast from raw data
                if (!displayForecast && forecastData[regionId]) {
                    const targetTime = new Date(currentTime);
                    displayForecast = forecastData[regionId].reduce((nearest, f) => {
                        const nearestDiff = Math.abs(new Date(nearest.time) - targetTime);
                        const fDiff = Math.abs(new Date(f.time) - targetTime);
                        return fDiff < nearestDiff ? f : nearest;
                    }, forecastData[regionId][0]);
                }
                
                if (displayForecast && featureLayersRef.current[regionId]) {
                    const layer = featureLayersRef.current[regionId];
                    const bounds = layer.getBounds();
                    const newLabel = createMeteoLabel(L, regionId, displayForecast, bounds, labelPosition, labelOffset, layer);
                    if (newLabel) {
                        newLabel.addTo(mapRef.current);
                        labelLayersRef.current[regionId] = newLabel;
                    }
                }
            }
        });
    }, [labelPosition, labelOffset, sixHourlySummary, forecastData, sixHourlyTimeSteps, currentTimeIndex, createMeteoLabel, wilayahAktif]);

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
                                <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur p-3 rounded-lg shadow-inner">
                                    {/* New UI: Display time slots as |Hari ini|Besok|Lusa| with 0 6 12 18 for each */}
                                    <div className="flex items-start gap-3">
                                        {['Hari ini', 'Besok', 'Lusa'].map((dayLabel, dayIdx) => {
                                            // Get the 4 timesteps for this day (indices: dayIdx*4 to dayIdx*4+3)
                                            const dayTimeSteps = sixHourlyTimeSteps.slice(dayIdx * 4, dayIdx * 4 + 4);
                                            
                                            return (
                                                <div key={dayLabel} className="flex flex-col items-center">
                                                    <div className="text-sm font-bold mb-2 text-gray-800">{dayLabel}</div>
                                                    <div className="flex gap-2">
                                                        {dayTimeSteps.map((t, hourIdx) => {
                                                            const globalIdx = dayIdx * 4 + hourIdx;
                                                            const isActive = globalIdx === currentTimeIndex;
                                                            const timeDate = new Date(t);
                                                            // Convert UTC to local time (WIB: UTC+7)
                                                            const hourLabel = timeDate.getHours().toString().padStart(2, '0');
                                                            
                                                            return (
                                                                <button
                                                                    key={t}
                                                                    onClick={() => setCurrentTimeIndex(globalIdx)}
                                                                    className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                                                                        isActive 
                                                                            ? 'bg-blue-600 text-white shadow-md' 
                                                                            : 'bg-white/60 text-gray-700 hover:bg-white/80'
                                                                    }`}
                                                                >
                                                                    {hourLabel}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
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


