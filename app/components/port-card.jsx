'use client';
import WeatherIcon from './weather-icon';
import { Thermometer, Navigation, Waves } from 'lucide-react';

const getWaveColor = (category) => {
    const colors = {
        'Tenang': 'bg-blue-300',
        'Rendah': 'bg-green-400',
        'Sedang': 'bg-yellow-400',
        'Tinggi': 'bg-orange-500',
        'Sangat Tinggi': 'bg-red-500',
        'Ekstrem': 'bg-purple-600',
    };
    return colors[category] || 'bg-gray-400';
};

const PortCard = ({dayLabel , tempRange, conditionText, windSpeed, windGust, windDirection, waveRange, waveCategory, theme }) => (
    <div className={`${theme.glassCardClass} p-5 flex flex-col h-[260px] w-[280px]`}>
        <div>
            <p className={`${theme.text.primary} text-xl font-bold`}>{dayLabel}</p>
        </div>
        
        <div className='flex-grow flex flex-col'>
            <div className="flex flex-row items-center justify-center space-x-4">
                <div className="flex flex-col items-center justify-center w-1/2">
                    <WeatherIcon condition={conditionText} size={90}/>
                    <p className={`text-lg font-bold text-center ${theme.text.primary} mt-1`}>{conditionText}</p>
                </div>
                <div className={`w-1/2 self-stretch border-l ${theme.border} flex flex-col justify-center space-y-3 pl-4`}>
                    <div className="flex flex-col items-center justify-center">
                        <Thermometer className="w-6 h-6 mb-1 text-red-500" />
                        <span className={`${theme.text.primary} text-sm font-bold`}>{tempRange}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <Navigation className={`w-6 h-6 mb-1 ${theme.text.secondary}`} style={{ transform: `rotate(${windDirection}deg)` }} />
                        <span className={`${theme.text.primary} text-sm font-bold`}>{windSpeed} knot</span>
                        <span className={`${theme.text.secondary} text-xs font-bold`}>Gust {windGust} knot</span>
                    </div>
                </div>
            </div>
        </div>

        <div className={` border-t ${theme.border} flex items-center justify-center space-x-3`}>
            <Waves className="w-5 h-5 text-cyan-500" />
            <div className={`w-4 h-4 rounded-full ${getWaveColor(waveCategory)}`}></div>
            <span className={`font-semibold text-sm ${theme.text.primary}`}>{waveCategory}</span>
            <span className={`text-sm ${theme.text.secondary}`}>({waveRange})</span>
        </div>
    </div>
);
export default PortCard;