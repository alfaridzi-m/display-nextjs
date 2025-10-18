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
import PerairanPage from './components/perairan';




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
                console.log(allData)
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


const Display = () => {
  const pages = ['weather', 'cities', 'Perairan'];
  const portIds = ['AA005', 'AA003', 'AA006','AA007','AA001'];
  const pageDurations = {
    weather: 15000 * portIds.length,
    cities: 30000,
    Perairan: 3000000,
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
            <PerairanPage theme={theme} isActive={activePage === 'Perairan'} />
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