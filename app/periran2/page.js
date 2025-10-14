'use client'

import { useState, useRef, useEffect, useCallback } from "react";
// DIHAPUS: import L from "leaflet"; Akan di-import secara dinamis
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import "leaflet/dist/leaflet.css";
import { darkTheme, lightTheme } from "../components/theme";

dayjs.extend(utc);

// DIUBAH: Konstanta diperbarui sesuai permintaan Anda
const WILAYAH_AKTIF = ['P.AH.01','P.AH.02','P.AH.03','P.AH.04','P.AH.05','P.AH.06','P.AH.07','P.AH.08','P.AH.09',];
const view_point = [-4.424, 128.9];
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


const PerairanPage = ({ theme = lightTheme }) => {
    const [mapTitle] = useState('Peta Prakiraan Kategori Gelombang');
    const [forecastData, setForecastData] = useState(null);
    const [timeSteps, setTimeSteps] = useState([]);
    const [sixHourlySummary, setSixHourlySummary] = useState(null);
    const [sixHourlyTimeSteps, setSixHourlyTimeSteps] = useState([]);
    const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [geojson, setGeojson] = useState(null); // BARU: state untuk menyimpan geojson

    const mapRef = useRef(null);
    const featureLayersRef = useRef({});
    const mapContainerRef = useRef(null);
    const intervalRef = useRef(null);
    const labelLayersRef = useRef({});

    // Function to create meteorological info label for each region
    const createMeteoLabel = useCallback((L, regionId, forecast, bounds) => {
        if (!forecast) return null;
        
        // Position label at top-left corner of the polygon instead of center
        const northWest = bounds.getNorthWest();
        const labelPosition = [northWest.lat - 0.05, northWest.lng + 0.05]; // Slight offset for better visibility
        
        const iconHtml = `
            <div style="
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(4px);
                border-radius: 6px;
                padding: 6px 10px;
                font-size: 11px;
                font-weight: 600;
                color: #1f2937;
                text-align: center;
                border: 2px solid ${KATEGORI_GELOMBANG[forecast.wave_cat]?.color || '#c1d4e3aa'};
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                white-space: nowrap;
                pointer-events: none;
            ">
                <div style="font-size: 16px; font-weight: 700; color: ${KATEGORI_GELOMBANG[forecast.wave_cat]?.color || '#c1d4e3aa'};">
                    ${forecast.wave_height}m
                </div>
                <div style="font-size: 13px; font-weight: 600; color: #374151; margin-top: 3px;">
                    🌬️ ${forecast.wind_speed}kt
                </div>
                <div style="font-size: 10px; color: #6b7280; margin-top: 1px;">
                    ${forecast.wind_from}
                </div>
            </div>
        `;
        
        const icon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [80, 60],
            iconAnchor: [0, 0] // Anchor at top-left of the icon
        });
        
        return L.marker(labelPosition, { icon, interactive: false });
    }, []);

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
                // Remove old label
                mapRef.current.removeLayer(labelLayersRef.current[regionId]);
                
                // Create and add new label
                const bounds = layer.getBounds();
                const newLabel = createMeteoLabel(L, regionId, forecast, bounds);
                if (newLabel) {
                    newLabel.addTo(mapRef.current);
                    labelLayersRef.current[regionId] = newLabel;
                }
            }
        }
    }, [sixHourlySummary, forecastData, timeSteps, createMeteoLabel]);

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        const initializeMap = async () => {
            const L = (await import('leaflet')).default;

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

            mapRef.current = L.map(mapContainerRef.current, { attributionControl: false }).setView(view_point, initial_zoom);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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
                        const bounds = featureLayersRef.current[regionId].getBounds();
                        const forecast = forecastData[regionId]?.[0];
                        const label = createMeteoLabel(L, regionId, forecast, bounds);
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
        };
    }, []);

    useEffect(() => {
        if (sixHourlyTimeSteps.length > 0) {
            const currentTime = sixHourlyTimeSteps[currentTimeIndex];
            updateFeatureStyles(currentTime);
        }
    }, [currentTimeIndex, sixHourlyTimeSteps, updateFeatureStyles]);


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
        <div className={`flex flex-col h-[calc(100vh-4rem)] ${theme.glassCardClass} rounded-3xl overflow-hidden`}>
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
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                                <div className="max-w-md mx-auto bg-white/70 backdrop-blur p-2 rounded-lg shadow-inner">
                                <p> Prakiraan Cuaca Jam</p>
                                    <div className="flex flex-wrap items-center justify-center gap-2">
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
                        <div className="absolute top-2 right-2 z-[1000] pointer-events-none">
                            <div className="bg-white/80 backdrop-blur rounded-md p-2 shadow border border-white/30 dark:border-white/10 max-w-xs">
                                <div className={`text-[11px] font-semibold mb-1 ${theme.text.primary}`}>Legenda Gelombang</div>
                                <ul className="space-y-1">
                                    {Object.entries(KATEGORI_GELOMBANG).filter(([k]) => k !== 'unknown').map(([category, { color, range }]) => (
                                        <li key={category} className="flex items-center justify-between gap-2 text-[11px]">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }}></span>
                                                <span className={`${theme.text.primary}`}>{category}</span>
                                            </div>
                                            <span className={`${theme.text.secondary}`}>{range}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PerairanPage;

