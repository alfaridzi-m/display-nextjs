'use client';
import WeatherIcon from './weather-icon';
import { Thermometer, Navigation2, Waves } from 'lucide-react';

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

const PortCard = ({dayLabel , tempMin, tempMax, conditionText, windSpeed, windGust, windDirection, waveRange, waveCategory, theme }) => (
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
                <div className={`w-1/2 self-stretch border-l ${theme.border} flex flex-col justify-between space-y-3 pl-4`}>
                    <div className="flex flex-row items-center justify-center">
                        <Thermometer className="w-13 h-13 text-red-500" />
                        <div className="flex flex-col">
                            <span className={`${theme.text.primary} text-lg font-medium`}>{tempMax}°</span>
                            <span className={`${theme.text.primary} text-lg font-medium`}>{tempMin}°</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <Navigation2 className={`w-8 h-8 mb-1 ${theme.text.secondary}`} style={{ transform: `rotate(${(windDirection)+180}deg)` }} />
                        <span className={`${theme.text.primary} text-lg font-bold`}>{windSpeed} knot</span>
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