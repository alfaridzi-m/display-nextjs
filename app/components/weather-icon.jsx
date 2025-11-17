'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const WeatherIcon = ({ condition, size = 24 }) => {
  const [animationData, setAnimationData] = useState(null);

  // Map weather conditions to animation file paths
  const weatherIconMap = {
    'Cerah': '/icon/cerah.json',
    'Cerah Berawan': '/icon/cerah-berawan.json',
    'Berawan': '/icon/berawan.json',
    'Berawan Tebal': '/icon/berawan-tebal.json',
    'Udara Kabur': '/icon/haze.json',
    'Petir': '/icon/petir.json',
    'Kabut': '/icon/kabut.json',
    'Hujan Ringan': '/icon/hujan-ringan.json',
    'Hujan Sedang': '/icon/hujan-sedang.json',
    'Hujan Lebat': '/icon/hujan-lebat.json',
    'Hujan Petir': '/icon/hujan-petir.json',
  };

  useEffect(() => {
    const iconPath = weatherIconMap[condition];
    
    if (iconPath) {
      // Fetch the animation JSON file
      fetch(iconPath)
        .then(response => response.json())
        .then(data => setAnimationData(data))
        .catch(error => console.error('Error loading animation:', error));
    }
  }, [condition]);

  // Calculate size in pixels (convert Tailwind size to pixels)
  const sizeInPx = typeof size === 'number' ? size : parseInt(size) * 4;

  // if (!animationData) {
  //   return (
  //     <div 
  //       style={{ width: `${sizeInPx}px`, height: `${sizeInPx}px` }}
  //       className="flex items-center justify-center"
  //     >
  //       <div className="animate-pulse bg-gray-200 rounded-full w-full h-full" />
  //     </div>
  //   );
  // }

  return (
    <div style={{ width: `${sizeInPx}px`, height: `${sizeInPx}px` }}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default WeatherIcon;