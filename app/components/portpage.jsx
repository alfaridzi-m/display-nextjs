'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import windDirectionToDegrees from './wind-dir';
import PortCard from './port-card';

const PortPage = ({ theme, portEndPoints }) => {
    const [portData, setPortData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);

    const portsPerPage = 6;
    const dayLabels = ['Hari Ini', 'Besok', 'Lusa'];

    const weatherSeverity = {
        'Cerah': 0, 
        'Cerah Berawan': 1, 
        'Berawan': 2, 
        'Berawan Tebal': 3,
        'Udara Kabur': 3, 
        'Petir': 5,
        'Kabut': 6, 
        'Hujan Ringan': 7, 
        'Hujan Sedang': 8, 
        'Hujan Lebat': 9,
        'Hujan Petir': 10, 
        'default': 99
    };

    // --- DATA FETCHING ---
    useEffect(() => {
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
    }, [portEndPoints]);

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
                                            
                                            console.log(`Summary for ${port.name} - ${label} (${targetDateString}):`, summary);

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

export default PortPage;
