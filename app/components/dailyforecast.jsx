'use client';
import WeatherIcon from './weather-icon';
import { Wind, Waves } from 'lucide-react';
const DailyForecastItem = ({ day, condition, tempMax, tempMin, theme, wave, wind }) => (
  <div className={`flex items-center justify-between p-3 border-b ${theme.border} last:border-b-0 text-lg`}>
    <span className={`${theme.text.secondary} font-medium`}>{day}</span>
    <div className={`flex flex-row items-center gap-3 ${theme.text.primary}`}>
      <div className=''>
        <WeatherIcon condition={condition} size={60}/>
      </div>
      <div className='flex flex-col'>
        <p className='text-red-800 font-medium'>{tempMax}</p>
        <p className='text-blue-800 font-medium'>{tempMin}</p>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <Waves className={`w-4 h-4 text-blue-800`} />
        <span className={`${theme.text.secondary} font-medium`}>{wave}</span>
      </div>
      <div className="flex items-center gap-1">
        <Wind className={`w-4 h-4 text-blue-800`} />
        <span className={`${theme.text.secondary} font-medium`}>{wind}</span>
      </div>
    </div>
  </div>
);
export default DailyForecastItem;