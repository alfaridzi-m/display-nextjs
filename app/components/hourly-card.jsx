'use client';
import { Thermometer, Navigation, Waves, Wind } from 'lucide-react';
import WeatherIcon from './weather-icon';
const HourlyForecastCard = ({ time, icon, temp, windSpeed, windGust, waveHeight, waveCategory, theme }) => (
    <div className={`flex flex-col items-center justify-between rounded-2xl p-4 mx-2 w-56 h-80 flex-shrink-0 ${theme.glassCardClass} ${theme.text.primary}`}>
        <span className={`${theme.text.secondary} text-2xl font-semibold`}>{time}</span>
        <WeatherIcon condition={icon} size={90} className="my-1" />
        <div className={`w-full mt-2 pt-2 border-t ${theme.border} text-sm`}>
            <div className="flex justify-center items-center space-x-1">
                <Wind className={`w-4 h-4 ${theme.text.secondary}`} />
                <span className={`${theme.text.primary} font-semibold`}>{windSpeed} - {windGust}</span>
                <span className={theme.text.secondary}>knot</span>
            </div>
            <div className="flex justify-center items-center space-x-1 mt-1">
                <Waves className={`w-4 h-4 ${theme.text.secondary}`} />
                <span className={`${theme.text.primary} font-semibold`}>{waveHeight}m</span>
                <span className={theme.text.secondary}>({waveCategory})</span>
            </div>
        </div>
        <Thermometer className="w-6 h-6 mb-1 text-red-500" /><span className="text-3xl font-bold">{temp}°</span>
    </div>
);
export default HourlyForecastCard;