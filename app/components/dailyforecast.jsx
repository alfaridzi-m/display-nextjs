'use client';
import WeatherIcon from './weather-icon';
const DailyForecastItem = ({ day, condition, temp, theme, wave, wind }) => (
  <div className={`flex items-center justify-between p-3 border-b ${theme.border} last:border-b-0`}>
    <span className={`${theme.text.secondary} w-1/4`}>{day}</span>
    <div className={`flex flex-col items-center w-1/2 ${theme.text.primary}`}>
      <WeatherIcon condition={condition} size={10}/>
      <p>{condition}</p>
    </div>
    <span className={`${theme.text.secondary}`}>{temp}</span>
  </div>
);
export default DailyForecastItem;