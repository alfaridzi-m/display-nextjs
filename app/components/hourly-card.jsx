'use client';
import { Thermometer, Navigation, Waves, Wind } from 'lucide-react';
import WeatherIcon from './weather-icon';
const HourlyForecastCard = ({theme ,time, icon, temp, windSpeed, windGust, waveHeight, waveCategory }) => (
    <div className={`flex flex-col items-center rounded-2xl gap-2 p-4 mx-2 w-56 h-80 flex-shrink-0 ${theme.glassCardClass} ${theme.text.primary}`}>
        <p className="text-xl font-semibold border-b w-full text-center pb-2 border-gray-400">{time}</p>
        
        {/* Replace this with your <WeatherIcon condition={icon} ... /> */}
        <div className={`flex items-center w-full gap-1 justify-center`}>
            <div className="flex flex-col items-center">
                <WeatherIcon condition={icon} size={120} className="my-1" />
            </div>
            <div className="flex flex-row items-start">
                <Thermometer className="w-8 h-8 text-red-500 mb-2"/>
                <p className={`text-xl font-semibold`}>{temp}°C</p>
            </div>
        </div>
        <p className="text-xl font-semibold text-center mb-4 border-top-">{icon}</p>
        
        <div className={`flex flex-row gap-2 w-full justify-between ${theme.border}`}>
            <div className={`flex flex-col items-start text-left`}>
              <p className={`text-xl font-semibold`}>{waveHeight} m</p>
              <p className={`text-sm text-slate-500 flex items-center gap-1`}><Waves className="w-8 h-8 text-cyan-500" /> {waveCategory}</p>
            </div>
            <div className="border-l border-gray-400"></div>
            <div className={`flex flex-col items-end text-right`}>
              <p className={`text-xl font-semibold`}>{windSpeed}-{windGust}</p>
              <p className={`text-sm text-slate-500 flex items-center gap-1`}><Wind className="w-8 h-8" /> knot</p>
            </div>
        </div>
        
    </div>
);
export default HourlyForecastCard;

