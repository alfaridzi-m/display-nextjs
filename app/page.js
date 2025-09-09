'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Wind, Droplets, Compass,Activity,Thermometer, Navigation, Waves } from 'lucide-react';
import WeatherIcon from './components/weather-icon';
import Clock from './components/clock';
import axios from 'axios';
import windDirectionToDegrees from './components/wind-dir';
import Sidebar from './components/side-bar';
import RunningText from './components/running-text';
import TidesCard from './components/tides-chart';
import { lightTheme, darkTheme } from './components/theme';
import HourlyForecastCard from './components/hourly-card';
import DailyForecastItem from './components/dailyforecast';
import PortCard from './components/port-card';
import InfoRow from './components/info-row';
import "leaflet/dist/leaflet.css";




const WeatherPage = ({ theme, list }) => {
    const [portData, setPortData] = useState([]);
    const [activePortIndex, setActivePortIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const weatherSeverity = {
        'Cerah': 0, 'Cerah Berawan': 1, 'Berawan': 2, 'Berawan Tebal': 3,
        'Kabut': 4, 'Hujan Ringan': 5, 'Hujan Sedang': 6, 'Hujan Lebat': 7,
        'Hujan Petir': 8, 'default': 99
    };

    useEffect(() => {
        const portIds = list;
        const urls = portIds.map(id => `https://maritim.bmkg.go.id/marine-data/pelabuhan/${id}.json`);

        const fetchAllData = async () => {
            setLoading(true);
            try {
                const responses = await Promise.all(urls.map(url => axios.get(url)));
                const allData = responses.map(res => res.data);
                setPortData(allData);
            } catch (error) {
                console.error('Gagal mengambil data cuaca:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [list]);

    useEffect(() => {
        if (portData.length > 1) {
            const timer = setInterval(() => {
                setActivePortIndex(prevIndex => (prevIndex + 1) % portData.length);
            }, 15000); // Ganti setiap 15 detik
            return () => clearInterval(timer);
        }
    }, [portData]);

    if (loading || portData.length === 0) {
        return <div className={`text-center p-10 ${theme.text.primary}`}>Loading Weather Data...</div>;
    }

    const data = portData[activePortIndex];
    
    const now = new Date();
    let closestIndex = 0;
    let minDiff = Infinity;

    data.forecast_day1.forEach((forecast, index) => {
        const forecastTime = new Date(forecast.time);
        const diff = Math.abs(forecastTime - now);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = index;
        }
    });

    const nextHourIndex = closestIndex + 1;
    const displayIndex = nextHourIndex < data.forecast_day1.length ? nextHourIndex : closestIndex;
    const displayForecast = data.forecast_day1[displayIndex];

    const hourlyData = data.forecast_day1
        .filter(item => new Date(item.time) >= new Date(now.getTime() - 60 * 60 * 1000)) // Start from one hour ago
        .map(item => ({
            time: new Date(item.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':'),
            icon: item.weather,
            temp: item.temp_avg,
            windSpeed: item.wind_speed,
            windGust: item.wind_gust,
            waveHeight: item.wave_height,
            waveCategory: item.wave_cat
        }));
    
    const processDailyForecast = (forecasts) => {
        if (!forecasts || forecasts.length === 0) return [];
        const dailySummaries = {};
        forecasts.forEach(forecast => {
            const date = forecast.time.split(' ')[0];
            if (!dailySummaries[date]) {
                dailySummaries[date] = { temps: [], conditions: {} };
            }
            dailySummaries[date].temps.push(forecast.temp_avg);
            dailySummaries[date].conditions[forecast.weather] = (dailySummaries[date].conditions[forecast.weather] || 0) + 1;
        });
        return Object.keys(dailySummaries).map(date => {
            const summary = dailySummaries[date];
            const minTemp = Math.min(...summary.temps);
            const maxTemp = Math.max(...summary.temps);
            const dominantCondition = Object.keys(summary.conditions).reduce((a, b) => 
                (weatherSeverity[a] || weatherSeverity.default) > (weatherSeverity[b] || weatherSeverity.default) ? a : b
            );
            return {
                day: new Date(date).toLocaleString('id-ID', { weekday: 'long' }),
                icon: dominantCondition,
                condition: dominantCondition,
                temp: `${minTemp}°/${maxTemp}°`
            };
        });
    };

    const dailyData = processDailyForecast(data['forecast_day2-4']);

    return (
        <div key={activePortIndex} className="flex flex-col gap-6 card-container animate-page-fade-in">
            <div className={`${theme.glassCardClass} w-full p-4 text-3xl font-bold text-center`}><span className='font-medium text-gray-700'>Prakiraan Cuaca</span> {data.name}</div>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className={`${theme.glassCardClass} p-6 flex flex-col justify-between card-item w-1/2 animate-card`} style={{ '--delay': '0.2s' }}>
                <p className={`text-2xl font-bold ${theme.text.primary}`}>Prakiraan Pukul {new Date(displayForecast.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')}</p>
                    <div className='flex justify-around items-center'>
                        <div className="flex flex-col space-y-6 border-r border-gray-300 pr-6">
                            <div className="grid grid-cols-3 gap-4">
                                <InfoRow icon={Thermometer} label="Suhu" value={`${displayForecast.temp_avg}°C`} sub="Udara" big theme={theme}/>
                                <InfoRow icon={Wind} label="Angin" value={`${displayForecast.wind_speed} - ${displayForecast.wind_gust} kt`} sub={displayForecast.wind_from} big theme={theme}/>
                                <InfoRow icon={Waves} label="Gelombang" value={`${displayForecast.wave_height} m`} sub={displayForecast.wave_cat} big theme={theme}/>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-t border-gray-300 pt-4">
                                <InfoRow icon={Droplets} label="Kelembapan" value={`${displayForecast.rh_avg}%`} sub="Rata-rata" theme={theme}/>
                                <InfoRow icon={Compass} label="Arus" value={displayForecast.current_to} sub={`${displayForecast.current_speed} cm/s`} theme={theme}/>
                                <InfoRow icon={Activity} label="Pasang" value={`${displayForecast.tides} m`} sub="Perkiraan" theme={theme}/>
                            </div>
                        </div>
                        <div className="w-1/6 flex flex-col items-center justify-center align-middle">
                            <WeatherIcon condition={displayForecast.weather} size={90}/>
                            <p className={`text-2xl font-bold text-slate-800 text-center ${theme.text.primary}`}>{displayForecast.weather}</p>
                        </div>
                    </div>
                </div>
            <div className={`${theme.glassCardClass} p-6 card-item lg:w-1/2 animate-card`} style={{ '--delay': '0.4s' }}>
                <TidesCard code={data.code} theme={theme} height={300} />
            </div>
                <div className={`${theme.glassCardClass} p-6 card-item lg:w-1/3 flex flex-col animate-card`}style={{ '--delay': '0.6s' }}>
                    <h3 className={`mb-2 text-2xl font-bold ${theme.text.primary}`}>Prakiraan 3 Hari Kedepan</h3>
                    <div className="space-y-1 flex-grow flex flex-col justify-around">
                        {dailyData.slice(0, 5).map((item, index) => (<DailyForecastItem key={index} {...item} theme={theme}/>))}
                    </div>
                </div>
            </div>
            <div className={`${theme.glassCardClass} pt-6 pb-4 card-item animate-card`} style={{ '--delay': '0.8s' }}>
                <h3 className={`font-semibold text-3xl px-6 mb-4 ${theme.text.primary}`}>Prakiraan Cuaca Hari Ini</h3>
                <div className="slider-container">
                    <div className="slider-track">
                        {hourlyData.length > 0 ? [...hourlyData, ...hourlyData].map((item, index) => (<HourlyForecastCard key={index} {...item} theme={theme}/>)) : <p className={`px-6 ${theme.text.secondary}`}>Tidak ada prakiraan lebih lanjut untuk hari ini.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CitiesPage = ({ theme }) => {
    const [portData, setPortData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);

    const portsPerPage = 6;
    const dayLabels = ['Hari Ini', 'Besok', 'Lusa'];

    const weatherSeverity = {
        'Cerah': 0, 'Cerah Berawan': 1, 'Berawan': 2, 'Berawan Tebal': 3,
        'Udara Kabur' : 4, 'Petir' : 5, 'Kabut': 6, 'Hujan Ringan': 7, 'Hujan Sedang': 8, 'Hujan Lebat': 9,
        'Hujan Petir': 10, 'default': 99
    };

    // --- DATA FETCHING ---
    useEffect(() => {
        const portEndPoints = ['AA001','AA004', 'AA005', 'AA006', 'AA007','AA008', 'AA009','AA010','AA011'];
        const urls = portEndPoints.map(id => `https://maritim.bmkg.go.id/marine-data/pelabuhan/${id}.json`);

        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                const responses = await Promise.allSettled(urls.map(url => axios.get(url)));
                const allData = responses
                    .filter(res => res.status === 'fulfilled' && res.value.data)
                    .map(res => res.value.data);
                setPortData(allData);
            } catch (err) {
                console.error("Gagal mengambil data:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAllData();
    }, []);

    // --- SLIDESHOW LOGIC ---
    useEffect(() => {
        if (isLoading || portData.length <= portsPerPage) return;

        const totalPages = Math.ceil(portData.length / portsPerPage);
        const timer = setInterval(() => {
            setCurrentPage(prevPage => (prevPage + 1) % totalPages);
        }, 15000); // Ganti halaman setiap 15 detik

        return () => clearInterval(timer);
    }, [isLoading, portData, portsPerPage]);

    // --- DATA PROCESSING FUNCTION ---
    const getDailySummary = (port, targetDateString) => {
        const allForecasts = [...(port.forecast_day1 || []), ...(port['forecast_day2-4'] || [])];
        const dailyForecasts = allForecasts.filter(f => f.time.startsWith(targetDateString));

        if (dailyForecasts.length === 0) return null;

        let worstWeather = dailyForecasts[0].weather;
        let minTemp = dailyForecasts[0].temp_avg;
        let maxTemp = dailyForecasts[0].temp_avg;
        let minWave = dailyForecasts[0].wave_height;
        let maxWave = dailyForecasts[0].wave_height;
        let maxWindGust = dailyForecasts[0].wind_gust;
        let waveCategoryForMax = dailyForecasts[0].wave_cat;

        dailyForecasts.forEach(forecast => {
            if ((weatherSeverity[forecast.weather] || weatherSeverity.default) > (weatherSeverity[worstWeather] || weatherSeverity.default)) {
                worstWeather = forecast.weather;
            }
            minTemp = Math.min(minTemp, forecast.temp_avg);
            maxTemp = Math.max(maxTemp, forecast.temp_avg);
            if (forecast.wave_height > maxWave) {
                maxWave = forecast.wave_height;
                waveCategoryForMax = forecast.wave_cat;
            }
            minWave = Math.min(minWave, forecast.wave_height);
            maxWindGust = Math.max(maxWindGust, forecast.wind_gust);
        });

        return {
            name: port.name.replace('Pelabuhan ', ''),
            tempRange: `${minTemp}° - ${maxTemp}°`,
            conditionText: worstWeather,
            windSpeed: dailyForecasts[0].wind_speed,
            windGust: maxWindGust,
            windDirection: windDirectionToDegrees(dailyForecasts[0].wind_from),
            waveRange: `${minWave} - ${maxWave} m`,
            waveCategory: waveCategoryForMax,
        };
    };

    const portsOnCurrentPage = portData.slice(
        currentPage * portsPerPage,
        (currentPage + 1) * portsPerPage
    );

    return (
        <div className="card-container animate-page-fade-in w-full">
            {isLoading ? (
                <div className={`text-center p-10 ${theme.text.primary}`}>Memuat Data Pelabuhan...</div>
            ) : (
                <div key={currentPage} className="animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-2 gap-2">
                        {portsOnCurrentPage.map((port, portIndex) => {
                            if (!port || !port.valid_from) return null;

                            return (
                                <div key={port.code} className={`p-1 rounded-2xl`} style={{animationDelay: `${portIndex * 100}ms`}}>
                                    <p className={`text-xl font-bold ${theme.text.primary} p-1 text-center ${theme.glassCardClass} rounded-xl mb-1`}>
                                        {port.name}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {dayLabels.map((label, dayIndex) => {
                                            const startDate = new Date(port.valid_from);
                                            const targetDate = new Date(startDate);
                                            targetDate.setUTCDate(startDate.getUTCDate() + dayIndex);
                                            const targetDateString = targetDate.toISOString().split('T')[0];
                                            const summary = getDailySummary(port, targetDateString);

                                            if (!summary) {
                                                return <div key={`${port.code}-${dayIndex}`} className={`text-xs ${theme.text.secondary} text-center`}>Data tidak tersedia</div>;
                                            }

                                            return (
                                                <PortCard 
                                                    key={`${port.code}-${dayIndex}`}
                                                    dayLabel={label}
                                                    tempRange={summary.tempRange}
                                                    conditionText={summary.conditionText}
                                                    windSpeed={summary.windSpeed}
                                                    windGust={summary.windGust}
                                                    windDirection={summary.windDirection}
                                                    waveRange={summary.waveRange}
                                                    waveCategory={summary.waveCategory}
                                                    theme={theme}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const PerairanPage = ({ theme }) => {
    const [mapTitle, setMapTitle] = useState('Peta Prakiraan Kategori Gelombang');
    const [forecastData, setForecastData] = useState(null);
    const [timeSteps, setTimeSteps] = useState([]);
    const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const mapRef = useRef(null);
    const featureLayersRef = useRef({}); // Ref untuk menyimpan layer poligon
    const mapContainerRef = useRef(null);
    const intervalRef = useRef(null);

    const kategoriGelombang = {
      Tenang: { color: "#2793f2" },
      Rendah: { color: "#00d342" },
      Sedang: { color: "#fff200" },
      Tinggi: { color: "#fd8436" },
      'Sangat Tinggi': { color: "#fb0510" },
      Ekstrem: { color: "#ef38ce" },
      'Sangat Ekstrem': { color: "#000000" },
      unknown: { color: "#808080" }
    };

    const getColorForWaveCategory = (category) => {
        return kategoriGelombang[category]?.color || kategoriGelombang.unknown.color;
    };

    async function fetchAndProcessForecasts(url = 'https://maritim.bmkg.go.id/marine-data/combine/forecast.json') {
        const dayjs = window.dayjs;
        const utc = window.dayjs_plugin_utc;
        dayjs.extend(utc);

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
            setTimeSteps(sortedTimes);
            setForecastData(lookup);
        } catch (err) {
            console.error('Error fetching or parsing forecasts:', err);
            throw err;
        }
    }

    // Inisialisasi peta dan gambar poligon awal
    useEffect(() => {
        const initializeMap = async () => {
                if (mapRef.current || !mapContainerRef.current) return;

                // buat peta
                mapRef.current = L.map(mapContainerRef.current, { attributionControl: false })
                  .setView([-2.548926, 118.0148634], 5);

                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }).addTo(mapRef.current);

                try {
                  const [geojsonData] = await Promise.all([
                    fetch("/wilpro.geojson").then(res => res.json()), // local file
                    fetchAndProcessForecasts(),
                  ]);

                  L.geoJSON(geojsonData, {
                    style: feature => ({
                      color: "#333",
                      weight: 1,
                      opacity: 0.8,
                      fillColor: kategoriGelombang.unknown.color,
                      fillOpacity: 0.75,
                    }),
                    onEachFeature: (feature, layer) => {
                        const regionId = feature.properties.ID_MAR;  // <-- sama dengan area.id
                        featureLayersRef.current[regionId] = layer;
                      }
                  }).addTo(mapRef.current);

                  // legend
                  const legend = L.control({ position: "bottomright" });
                  legend.onAdd = function () {
                    const div = L.DomUtil.create("div", "info legend");
                    let labels = ["<strong>Kategori Gelombang</strong>"];
                    for (const category in kategoriGelombang) {
                      const { color } = kategoriGelombang[category];
                      const label = category === "unknown" ? "Tidak Ada Data" : category;
                      labels.push(`<i style="background:${color}"></i> ${label}`);
                    }
                    div.innerHTML = labels.join("<br>");
                    return div;
                  };
                  legend.addTo(mapRef.current);
                } catch (error) {
                  console.error("Gagal menginisialisasi peta:", error);
                }
              };

        if (!window.L || !window.dayjs) {
            const loadScript = (src, id) => new Promise((resolve, reject) => {
                if (document.getElementById(id)) { resolve(); return; }
                const script = document.createElement('script');
                script.src = src; script.id = id; script.async = true;
                script.onload = resolve; script.onerror = reject;
                document.head.appendChild(script);
            });
            Promise.all([
                loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "leaflet-script"),
                loadScript("https://unpkg.com/dayjs@1.11.10/dayjs.min.js", "dayjs-script")
            ]).then(() => {
                loadScript("https://unpkg.com/dayjs@1.11.10/plugin/utc.js", "dayjs-utc-plugin").then(() => {
                    window.dayjs.extend(window.dayjs_plugin_utc);
                    initializeMap();
                });
            }).catch(err => console.error("Gagal memuat skrip eksternal:", err));
        } else {
            initializeMap();
        }
        return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }, []);

    // Perbarui gaya & popup saat indeks waktu berubah
    useEffect(() => {
        if (Object.keys(featureLayersRef.current).length === 0 || !forecastData || timeSteps.length === 0 || !window.dayjs) return;

        const currentTime = timeSteps[currentTimeIndex];

        for (const regionId in featureLayersRef.current) {
            const layer = featureLayersRef.current[regionId];
            const regionForecasts = forecastData[regionId];
            let waveCategoryColor = kategoriGelombang.unknown.color;
            let popupContent = `Prakiraan cuaca untuk wilayah ini (${regionId}) tidak tersedia.`;

            if (regionForecasts) {
                const forecast = regionForecasts.find(f => f.time.toISOString() === currentTime);
                if (forecast) {
                    waveCategoryColor = getColorForWaveCategory(forecast.wave_cat);
                    popupContent = `<div style="font-family: sans-serif; line-height: 1.5;"><h3 style="margin: 0 0 5px 0; font-size: 16px;">${layer.feature.properties.nama}</h3><strong>Waktu:</strong> ${window.dayjs(forecast.time).format('DD MMM YYYY, HH:mm')}<hr style="margin: 5px 0;"><strong>Cuaca:</strong> ${forecast.weather}<br><strong>Tinggi Gelombang:</strong> ${forecast.wave_height} m (${forecast.wave_cat})<br><strong>Angin:</strong> ${forecast.wind_speed} knots dari ${forecast.wind_from}</div>`;
                }
            }
            layer.setStyle({ fillColor: waveCategoryColor });
            layer.bindPopup(popupContent);
        }
    }, [forecastData, timeSteps, currentTimeIndex]);

    // Logika Autoplay
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setCurrentTimeIndex(prev => {
                    const nextIndex = prev + 1;
                    if (nextIndex >= timeSteps.length) {
                        clearInterval(intervalRef.current);
                        setIsPlaying(false);
                        return prev;
                    }
                    return nextIndex;
                });
            }, 1500); // Ganti waktu setiap 1.5 detik
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPlaying, timeSteps]);

    const handleTogglePlay = () => {
        if (currentTimeIndex >= timeSteps.length - 1) {
            setCurrentTimeIndex(0);
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className={`flex flex-col h-[calc(100vh-4rem)] ${theme.glassCardClass} rounded-3xl overflow-hidden`}>
            <header className="p-4 z-10 border-b ${theme.border}">
                <h1 className={`text-xl font-bold text-center ${theme.text.primary}`}>{mapTitle}</h1>
                <p className={`text-center text-sm ${theme.text.secondary} mb-3`}>Sumber data: BMKG</p>

                {timeSteps.length > 0 && (
                    <div className="max-w-md mx-auto bg-white/20 p-2 rounded-lg shadow-inner flex items-center justify-between space-x-2">
                        <button
                            onClick={handleTogglePlay}
                            className="px-4 py-2 bg-sky-500 text-white rounded-md font-bold w-24 text-center transition-colors duration-300 hover:bg-sky-600"
                        >
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <div className="text-center flex-grow">
                            <div className={`text-xs ${theme.text.secondary}`}>Waktu Prakiraan</div>
                            <div className={`font-bold text-base ${theme.text.primary}`}>
                                {window.dayjs ? window.dayjs(timeSteps[currentTimeIndex]).format('ddd, DD MMM YYYY HH:mm') : 'Memuat...'}
                            </div>
                        </div>
                        <div className="w-24" />
                    </div>
                )}
            </header>
            <main className="flex-grow relative">
                <div ref={mapContainerRef} id="map" style={{ width: '100%', height: '100%' }} />
            </main>
        </div>
    );
};


// --- Komponen Utama Aplikasi ---

const Display = () => {
  const pages = ['weather', 'cities', 'Perairan'];
  const portIds = ['AA005', 'AA003', 'AA006','AA007','AA001'];
  const pageDurations = {
    weather: 15000 * portIds.length,
    cities: 30000,
    Perairan: 30000,
  }
  const [activePage, setActivePage] = useState(pages[0]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleNavClick = (page) => {
    setActivePage(page);
  };

  useEffect(() => {
    const duration = pageDurations[activePage];
    const timer = setTimeout(() => {
      const currentIndex = pages.indexOf(activePage)
      const nextIndex = (currentIndex + 1) % pages.length;
      setActivePage(pages[nextIndex]);
    }, duration);
    return () => clearTimeout(timer);
  }, [activePage]); // Reset timer on manual click

  return (
    <>
      <div 
        className={`min-h-screen flex flex-col md:flex-row font-sans relative overflow-hidden dark bg-cover bg-center`}
        style={{ backgroundImage: `url(${theme.background.image})` }}
      >
        <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full filter blur-3xl opacity-70 animate-blob ${theme.overlay}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-4000 ${theme.overlay2}`}></div>

        <Sidebar activePage={activePage} handleNavClick={handleNavClick} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} pageDurations={pageDurations} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 overflow-y-auto z-10">
          
        <div>
        <div style={{ display: activePage === 'weather' ? 'block' : 'none' }}>
            <WeatherPage theme={theme} list={portIds} />
        </div>
        <div style={{ display: activePage === 'cities' ? 'block' : 'none' }}>
            <CitiesPage theme={theme} />
        </div>
        <div style={{ display: activePage === 'Perairan' ? 'block' : 'none' }}>
            <PerairanPage theme={theme} />
        </div>
        </div>

        </main>
        <Clock theme={theme} isDarkMode={isDarkMode}/>
        <RunningText theme={theme} />
      </div>
    </>
  );
}

export default Display