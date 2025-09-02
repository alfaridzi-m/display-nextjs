'use client';
import { Thermometer, Navigation, Waves, Wind } from 'lucide-react';
import WeatherIcon from './weather-icon';
const HourlyForecastCard = ({theme ,time, icon, temp, windSpeed, windGust, waveHeight, waveCategory }) => (
    <div className={`flex flex-col items-center justify-between rounded-2xl p-4 mx-2 w-56 h-80 flex-shrink-0 ${theme.glassCardClass} ${theme.text.primary}`}>
        <p className="text-xl font-semibold border-b w-full text-center pb-2 border-gray-400">{time}</p>
        
        {/* Replace this with your <WeatherIcon condition={icon} ... /> */}
        <WeatherIcon condition={icon} size={90} className="my-1" />
        
        <div className={`grid grid-cols-2 gap-4 w-full text-center ${theme.border}`}>
            <div className={`flex flex-col items-center"`}>
              <p className={`text-2xl font-bold`}>{waveHeight} m</p>
              <p className={`text-sm text-slate-500 flex items-center gap-1`}><Waves className="w-8 h-8 text-cyan-500" /> {waveCategory}</p>
            </div>
            <div className={`flex flex-col items-center`}>
              <p className={`text-2xl font-bold`}>{windSpeed}-{windGust}</p>
              <p className={`text-sm text-slate-500 flex items-center gap-1`}><Wind className="w-8 h-8" /> knot</p>
            </div>
        </div>
        
        <p className={`text-xl font-bold flex items-center gap-1.5`}><Thermometer className="w-8 h-8 text-red-500"/> {temp}°C</p>
    </div>
);
export default HourlyForecastCard;

