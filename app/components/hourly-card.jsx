'use client';
import { Thermometer, Navigation, Waves, Wind } from 'lucide-react';
import WeatherIcon from './weather-icon';
const HourlyForecastCard = ({theme ,time, icon, temp, windSpeed, windGust, waveHeight, waveCategory }) => (
    <div className={`flex flex-col items-center justify-between rounded-2xl p-4 mx-2 w-56 h-80 flex-shrink-0 ${theme.glassCardClass} ${theme.text.primary}`}>
        <p className="text-xl font-semibold border-b w-full text-center pb-2 border-gray-400">{time}</p>
        
        {/* Replace this with your <WeatherIcon condition={icon} ... /> */}
        <div className={`flex items-center justify-between w-full gap-4`}>
            <div className="flex flex-col items-center">
                <WeatherIcon condition={icon} size={100} className="my-1" />
            </div>
            <div className="flex flex-row items-start">
                <Thermometer className="w-8 h-8 text-red-500 mb-2"/>
                <p className={`text-xl font-semibold`}>{temp}°C</p>
            </div>
        </div>
            <p className="text-xl font-semibold text-center">{icon}</p>
        
        <div className={`grid grid-cols-2 gap-4 w-full ${theme.border}`}>
            <div className={`flex flex-col items-start text-left`}>
              <p className={`text-2xl font-semibold`}>{waveHeight} m</p>
              <p className={`text-sm text-slate-500 flex items-center gap-1`}><Waves className="w-8 h-8 text-cyan-500" /> {waveCategory}</p>
            </div>
            <div className={`flex flex-col items-end text-right`}>
              <p className={`text-2xl font-semibold`}>{windSpeed}-{windGust}</p>
              <p className={`text-sm text-slate-500 flex items-center gap-1`}><Wind className="w-8 h-8" /> knot</p>
            </div>
        </div>
        
    </div>
);
export default HourlyForecastCard;

