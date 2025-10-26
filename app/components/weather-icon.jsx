'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Sun, CloudFog, CloudSun, Cloud, Cloudy ,CloudDrizzle , CloudRain, CloudRainWind, CloudLightning, Wind, Droplets, Thermometer, Map, List, Navigation, Moon, FishSymbol, Waves, Anchor, HelpCircle, Zap, Haze } from 'lucide-react';
const WeatherIcon = ({ condition, size }) => {
  const weatherIconMap = {
    'Cerah': <Sun className={`w-${size} h-${size} text-yellow-400`} />,
    'Cerah Berawan': <CloudSun className={`w-${size} h-${size} text-yellow-400`} />,
    'Berawan': <Cloud className={`w-${size} h-${size} text-gray-400`} />,
    'Berawan Tebal': <Cloudy className={`w-${size} h-${size} text-gray-500`} />,
    'Udara Kabur': <Haze className={`w-${size} h-${size} text-gray-300`} />,
    'Petir': <Zap className={`w-${size} h-${size} text-yellow-500`} />,
    'Kabut': <CloudFog className={`w-${size} h-${size} text-gray-300`} />,
    'Hujan Ringan': <CloudDrizzle className={`w-${size} h-${size} text-blue-400`} />,
    'Hujan Sedang': <CloudRain className={`w-${size} h-${size} text-blue-500`} />,
    'Hujan Lebat': <CloudRainWind className={`w-${size} h-${size} text-blue-600`} />,
    'Hujan Petir': <CloudLightning className={`w-${size} h-${size} text-yellow-500`} />, // Lightning with rain fix icon
    'default': <HelpCircle className={`w-${size} h-${size} text-yellow-500`} />
  };

  const IconComponent = weatherIconMap[condition] || weatherIconMap['default'];
  return React.cloneElement(IconComponent, { size });
};

export default WeatherIcon;