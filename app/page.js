'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Wind, Droplets, Compass,Activity,Thermometer, Navigation, Waves } from 'lucide-react';
import WeatherIcon from './components/weather-icon';
import Clock from './components/clock';
import axios from 'axios';
import windDirectionToDegrees from './components/wind-dir';
import Sidebar from './components/side-bar';
import RunningText from './components/running-text';
import { lightTheme, darkTheme } from './components/theme';
import PortCard from './components/port-card';
import PerairanPage from './components/perairan';
import WeatherPage from './components/weatherpage';
import PortPage from './components/portpage';


const Display = () => {
  const router = useRouter();
  const [isConfigValid, setIsConfigValid] = useState(false);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  const [configData, setConfigData] = useState(null);
  
  const pages = ['weather', 'cities', 'Perairan'];
  const portIds = ['AA005', 'AA003', 'AA006','AA007','AA001'];
  const portEndPoints = ['AA002','AA004', 'AA005', 'AA006', 'AA007','AA008', 'AA009','AA010','AA011'];
  const pageDurations = {
    weather: 15000 * portIds.length,
    cities: 30000,
    Perairan: 3000000,
  }
  const [activePage, setActivePage] = useState(pages[0]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Check for configuration on component mount
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        // Check if ID exists in localStorage
        const storedId = localStorage.getItem('displayConfigId');
        
        if (!storedId) {
          // No ID stored, redirect to config selection
          router.push('/config-select');
          return;
        }

        // Validate that the ID exists in the config folder
        const response = await fetch(`/api/configure?id=${storedId}`);
        const result = await response.json();

        if (result.success && result.data) {
          // Configuration is valid
          setIsConfigValid(true);
          setConfigData(result.data);
        } else {
          // Configuration not found, clear localStorage and redirect
          localStorage.removeItem('displayConfigId');
          router.push('/config-select');
        }
      } catch (error) {
        console.error('Error checking configuration:', error);
        // On error, redirect to config selection
        localStorage.removeItem('displayConfigId');
        router.push('/config-select');
      } finally {
        setIsCheckingConfig(false);
      }
    };

    checkConfiguration();
  }, [router]);

  const handleNavClick = (page) => {
    setActivePage(page);
  };

  useEffect(() => {
    const duration = pageDurations[activePage];
    const timer = setTimeout(() => {
      const currentIndex = pages.indexOf(activePage)
      const nextIndex = (currentIndex + 1) % pages.length;
      setActivePage(pages[nextIndex]);
    }, duration);
    return () => clearTimeout(timer);
  }, [activePage]); // Reset timer on manual click

  // Show loading state while checking configuration
  if (isCheckingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Memeriksa konfigurasi...</p>
        </div>
      </div>
    );
  }

  // Only render the display if configuration is valid
  if (!isConfigValid) {
    return null; // Router will handle redirect
  }

  return (
    <>
      <div 
        className={`min-h-screen flex flex-col md:flex-row font-sans relative overflow-hidden dark bg-cover bg-center`}
        style={{ backgroundImage: `url(${theme.background.image})` }}
      >
        <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full filter blur-3xl opacity-70 animate-blob ${theme.overlay}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-4000 ${theme.overlay2}`}></div>

        <Sidebar activePage={activePage} handleNavClick={handleNavClick} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} pageDurations={pageDurations} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 overflow-y-auto z-10">
          
        <div>
        <div style={{ display: activePage === 'weather' ? 'block' : 'none' }}>
            <WeatherPage theme={theme} list={portIds} />
        </div>
        <div style={{ display: activePage === 'cities' ? 'block' : 'none' }}>
            <PortPage theme={theme} portEndPoints={[portEndPoints]} />
        </div>
        <div style={{ display: activePage === 'Perairan' ? 'block' : 'none' }}>
            <PerairanPage theme={theme} isActive={activePage === 'Perairan'} />
        </div>
        </div>

        </main>
        <Clock theme={theme} isDarkMode={isDarkMode}/>
        <RunningText theme={theme} />
      </div>
    </>
  );
}

export default Display