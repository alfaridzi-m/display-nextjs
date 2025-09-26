'use client'

import { useState, useRef, useEffect, useCallback } from "react";
// DIHAPUS: import L from "leaflet"; Akan di-import secara dinamis
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import "leaflet/dist/leaflet.css";
import { darkTheme, lightTheme } from "../components/theme";
import InfoPanel from "../components/infopanel";

// PINDAH: Pindahkan konstanta ke luar komponen agar tidak dibuat ulang setiap render
dayjs.extend(utc);

// DIUBAH: Konstanta diperbarui sesuai permintaan Anda
const WILAYAH_AKTIF = ['P.AH.01','P.AH.02','P.AH.03','P.AH.04','P.AH.05','P.AH.06','P.AH.07','P.AH.08','P.AH.09',];
const view_point = [-3.2186, 128.675107];
const initial_zoom = 8;

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


const PerairanPage = ({ theme = lightTheme }) => {
    const [mapTitle] = useState('Peta Prakiraan Kategori Gelombang');
    const [forecastData, setForecastData] = useState(null);
    const [timeSteps, setTimeSteps] = useState([]);
    const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [geojson, setGeojson] = useState(null); // BARU: state untuk menyimpan geojson

    const mapRef = useRef(null);
    const featureLayersRef = useRef({});
    const mapContainerRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        const styleId = 'leaflet-custom-tooltip-styles';
        if (document.getElementById(styleId)) return; 

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .region-label-tooltip {
                background-color: rgba(255, 255, 255, 0.75);
                backdrop-filter: blur(2px);
                border: none;
                box-shadow: none;
                color: #27272a; /* zinc-800 */
                font-weight: 600; /* semibold */
                font-size: 10px;
                padding: 1px 4px;
                border-radius: 3px;
            }
        `;
        document.head.appendChild(style);

        return () => {
            const styleElement = document.getElementById(styleId);
            if (styleElement) {
                document.head.removeChild(styleElement);
            }
        };
    }, []);

    const updateFeatureStyles = useCallback((timeISO) => {
        if (!forecastData || Object.keys(featureLayersRef.current).length === 0) return;

        for (const regionId in featureLayersRef.current) {
            const layer = featureLayersRef.current[regionId];
            const regionForecasts = forecastData[regionId];
            let waveCategoryColor = KATEGORI_GELOMBANG.unknown.color;
            
            if (regionForecasts) {
                const forecast = regionForecasts.find(f => f.time.toISOString() === timeISO);
                if (forecast) {
                    waveCategoryColor = getColorForWaveCategory(forecast.wave_cat);
                }
            }
            layer.setStyle({ fillColor: waveCategoryColor });
        }
    }, [forecastData]);

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
            
            mapRef.current = L.map(mapContainerRef.current, { attributionControl: false }).setView(view_point, initial_zoom);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(mapRef.current);

            try {
                const geojsonData = await fetch("/wilpro.geojson").then(res => res.json());
                setGeojson(geojsonData); // DIUBAH: Simpan geojson ke state
                const { forecastData, timeSteps } = await fetchAndProcessForecasts();
                
                setForecastData(forecastData);
                setTimeSteps(timeSteps);

                L.geoJSON(geojsonData, {
                    style: feature => ({
                        color: "#333",
                        weight: WILAYAH_AKTIF.includes(feature.properties.ID_MAR) ? 1.5 : 0.5,
                        opacity: 0.8,
                        fillColor: KATEGORI_GELOMBANG.unknown.color,
                        fillOpacity: 0.75,
                    }),
                    onEachFeature: (feature, layer) => {
                        const regionId = feature.properties.ID_MAR;
                        if (WILAYAH_AKTIF.includes(regionId)) {
                            featureLayersRef.current[regionId] = layer;
                            // DIHAPUS: Logika onClick untuk memilih wilayah dihapus
                            layer.bindTooltip(regionId, {
                                permanent: true,
                                direction: 'center',
                                className: 'region-label-tooltip',
                                offset: [0, 0]
                            }).openTooltip();
                        }
                    }
                }).addTo(mapRef.current);
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
        if (timeSteps.length > 0) {
            const currentTime = timeSteps[currentTimeIndex];
            updateFeatureStyles(currentTime);
        }
    }, [currentTimeIndex, timeSteps, updateFeatureStyles]);


    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setCurrentTimeIndex(prev => (prev + 1) % timeSteps.length);
            }, 1500);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPlaying, timeSteps]);
    
    const handleTogglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className={`flex flex-col h-[calc(100vh-4rem)] ${theme.glassCardClass} rounded-3xl overflow-hidden`}>
            <header className={`p-4 z-10 border-b ${theme.border} shrink-0`}>
                <h1 className={`text-xl font-bold text-center ${theme.text.primary}`}>{mapTitle}</h1>
                <p className={`text-center text-sm ${theme.text.secondary} mb-3`}>Sumber data: BMKG</p>
                
                {!isLoading && timeSteps.length > 0 && (
                     <div className="max-w-md mx-auto bg-white/20 p-2 rounded-lg shadow-inner flex items-center justify-between space-x-2">
                        <button onClick={handleTogglePlay} className="px-4 py-2 bg-sky-500 text-white rounded-md font-bold w-24 text-center transition-colors duration-300 hover:bg-sky-600">
                             {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <div className="text-center flex-grow">
                            <div className={`text-xs ${theme.text.secondary}`}>Waktu Prakiraan</div>
                            <div className={`font-bold text-base ${theme.text.primary}`}>
                                {dayjs(timeSteps[currentTimeIndex]).format('ddd, DD MMM YYYY HH:mm')}
                            </div>
                        </div>
                         {/* DIHAPUS: Placeholder div yang kosong */}
                     </div>
                )}
                {isLoading && <div className="text-center">Memuat data peta...</div>}
            </header>

            <main className="flex-grow flex flex-row overflow-hidden">
                <div className="w-1/2 p-4 flex items-center justify-center">
                    <div ref={mapContainerRef} className="w-full aspect-square rounded-lg shadow-lg" />
                </div>
                <div className="w-1/2 p-4 overflow-y-auto">
                    {/* DIUBAH: Props disesuaikan untuk dasbor */}
                    <InfoPanel 
                        activeRegions={WILAYAH_AKTIF}
                        allForecasts={forecastData}
                        currentTimeISO={timeSteps.length > 0 ? timeSteps[currentTimeIndex] : null}
                        waveCategories={KATEGORI_GELOMBANG}
                        theme={theme}
                        geojsonFeatures={geojson ? geojson.features : []}
                    />
                </div>
            </main>
        </div>
    );
};

export default PerairanPage;

