'use client';

import React, { useState, useEffect } from 'react';
import { Wind, Droplets, Compass, Activity, Thermometer, Waves, Navigation, Navigation2 } from 'lucide-react';
import WeatherIcon from './weather-icon';
import axios from 'axios';
import TidesCard from './tides-chart';
import HourlyForecastCard from './hourly-card';
import DailyForecastItem from './dailyforecast';
import InfoRow from './info-row';
import windDirectionToDegrees from './wind-dir';
import getWaveColor from './wave-color';

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
                dailySummaries[date] = { temps: [], conditions: {}, waves: [], winds: [] };
            }
            // Normalize to numbers just in case values are strings
            const temp = Number(forecast.temp_avg);
            const wave = Number(forecast.wave_height);
            const wind = Number(forecast.wind_speed);

            if (!Number.isNaN(temp)) dailySummaries[date].temps.push(temp);
            if (!Number.isNaN(wave)) dailySummaries[date].waves.push(wave);
            if (!Number.isNaN(wind)) dailySummaries[date].winds.push(wind);
            dailySummaries[date].conditions[forecast.weather] = (dailySummaries[date].conditions[forecast.weather] || 0) + 1;
        });
        return Object.keys(dailySummaries).map(date => {
            const summary = dailySummaries[date];
            const minTemp = Math.min(...summary.temps);
            const maxTemp = Math.max(...summary.temps);
            const minWave = summary.waves.length ? Math.min(...summary.waves) : null;
            const maxWave = summary.waves.length ? Math.max(...summary.waves) : null;
            const minWind = summary.winds.length ? Math.min(...summary.winds) : null;
            const maxWind = summary.winds.length ? Math.max(...summary.winds) : null;
            const dominantCondition = Object.keys(summary.conditions).reduce((a, b) => 
                (weatherSeverity[a] || weatherSeverity.default) > (weatherSeverity[b] || weatherSeverity.default) ? a : b
            );
            return {
                day: new Date(date).toLocaleString('id-ID', { weekday: 'long' }),
                icon: dominantCondition,
                condition: dominantCondition,
                tempMax: `${maxTemp}°C`,
                tempMin: `${minTemp}°C`,
                wave: minWave !== null && maxWave !== null ? `${minWave} - ${maxWave} m` : '-',
                wind: minWind !== null && maxWind !== null ? `${minWind} - ${maxWind} kt` : '-',
            };
        });
    };

    const dailyData = processDailyForecast(data['forecast_day2-4']);

    // Get wind direction rotation
    const windRotation = windDirectionToDegrees(displayForecast.wind_from);
    
    // Get wave color based on category
    const waveColor = getWaveColor(displayForecast.wave_cat);

    return (
        <div key={activePortIndex} className="flex flex-col gap-6 card-container animate-page-fade-in">
            <div className={`${theme.glassCardClass} w-full p-4 text-3xl font-bold text-center text-sky-800`}><span className='font-medium text-gray-700'>Prakiraan Cuaca</span> {data.name}</div>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className={`${theme.glassCardClass} p-6 flex flex-col justify-between card-item w-1/2 animate-card`} style={{ '--delay': '0.2s' }}>
                <p className={`text-2xl font-bold ${theme.nav.text}`}>Prakiraan Pukul {new Date(displayForecast.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')}</p>
                    <div className='flex justify-around items-center'>
                        <div className="flex flex-col space-y-6 border-r border-gray-300 pr-6">
                            <div className="grid grid-cols-3 gap-4">
                                <InfoRow icon={Thermometer} label="Suhu" sub={"Udara"} value={`${displayForecast.temp_avg}°C`} big theme={theme}/>
                                <InfoRow 
                                    icon={Wind} 
                                    label="Angin" 
                                    value={`${displayForecast.wind_speed} - ${displayForecast.wind_gust} kt`} 
                                    sub={displayForecast.wind_from} 
                                    big 
                                    theme={theme}
                                    customIcon={
                                        <Navigation2 
                                            className={`mb-2 w-12 h-12 ${theme.text.secondary}`} 
                                            style={{ transform: `rotate(${(windRotation)+180}deg)` }}
                                        />
                                    }
                                />
                                <InfoRow 
                                    icon={Waves} 
                                    label="Gelombang" 
                                    value={`${displayForecast.wave_height} m`} 
                                    sub={displayForecast.wave_cat} 
                                    big 
                                    theme={theme}
                                    waveColor={waveColor}
                                />
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
                    <h3 className={`mb-2 text-2xl font-bold ${theme.nav.text}`}>Prakiraan 3 Hari Kedepan</h3>
                    <div className="space-y-1 flex-grow flex flex-col justify-around w-full">
                        {dailyData.slice(0, 5).map((item, index) => (<DailyForecastItem key={index} {...item} theme={theme}/>))}
                    </div>
                </div>
            </div>
            <div className={`${theme.glassCardClass} pt-6 pb-4 card-item animate-card`} style={{ '--delay': '0.8s' }}>
                <h3 className={` text-2xl px-6 mb-4 font-bold ${theme.nav.text}`}>Prakiraan Cuaca Hari Ini</h3>
                <div className="slider-container">
                    <div className="slider-track">
                        {hourlyData.length > 0 ? [...hourlyData, ...hourlyData].map((item, index) => (<HourlyForecastCard key={index} {...item} theme={theme}/>)) : <p className={`px-6 ${theme.text.secondary}`}>Tidak ada prakiraan lebih lanjut untuk hari ini.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherPage;
