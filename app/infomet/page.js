'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import WeatherPage from '../components/weatherpage';
import PortPage from '../components/portpage';
import Clock from '../components/clock';
import Sidebar from '../components/side-bar';
import RunningText from '../components/running-text';
import { lightTheme, darkTheme } from '../components/theme';
import PerairanPage from '../components/perairan';
import PetaPage from '../components/petaPage';
import TopBar from '../components/top-bar';
import BookPage from '../components/bookpage';

const Display = () => {
  const router = useRouter();
  const pages = ['book', 'weather', 'cities', 'Perairan', 'Peta'];
  
  const [portIds, setPortIds] = useState([]);
  const [portEndPoints, setPortEndPoints] = useState([]);
  const [WILAYAH_AKTIF, setWilayahAktif] = useState([]);
  const [view_point, setViewPoint] = useState([0, 0]);
  const [initial_zoom, setInitialZoom] = useState(1);
  const [Your_location, setYourLocation] = useState([0, 0]);
  const [displayTitle, setDisplayTitle] = useState('');
  const [labelPosition, setLabelPosition] = useState('center');
  const [individualPositions, setIndividualPositions] = useState({});
  const [connectorStartPositions, setConnectorStartPositions] = useState({});
  const [waveLegendPosition, setWaveLegendPosition] = useState({ x: null, y: null });
  const [configLoaded, setConfigLoaded] = useState(false);
  
  const pageDurations = {
    book : 10000,
    weather: Math.max(16000, 16000 * portIds.length),
    cities: 60000,
    Perairan: 60000,
    Peta: 20000,
  }
  const [activePage, setActivePage] = useState(pages[0]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScreenSizeValid, setIsScreenSizeValid] = useState(true);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Load configuration from localStorage and fetch from API
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        const configId = localStorage.getItem('infometId');
        if (!configId) {
          console.log('No configuration ID found');
          router.push('/config-select');
          return;
        }

        console.log('Loading configuration:', configId);
        const response = await axios.get(`/api/configure?id=${configId}`);
        
        const { data: config } = response.data;
        
        // Apply configuration using optional chaining and destructuring
        setDisplayTitle(config.displayTitle || config.nama_display || '');
        setPortIds(config.ports?.portIds || []);
        setPortEndPoints(config.ports?.portEndPoints || []);
        setWilayahAktif(config.wilayah_aktif || []);
        setViewPoint(config.map_settings?.view_point || [0, 0]);
        setInitialZoom(config.map_settings?.initial_zoom || 1);
        setYourLocation(config.map_settings?.your_location || [0, 0]);
        setLabelPosition(config.perairan_settings?.label_position || 'center');
        setIndividualPositions(config.perairan_settings?.individual_positions || {});
        setConnectorStartPositions(config.perairan_settings?.connector_start_positions || {});
        setWaveLegendPosition(config.perairan_settings?.wave_legend_position || { x: null, y: null });
        
        console.log('Configuration loaded:', config.id);
      } catch (error) {
        console.error('Error loading configuration:', error);
      } finally {
        setConfigLoaded(true);
      }
    };

    loadConfiguration();
  }, []);


  // Screen size validation
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({ width, height });
      
      const isValid = width >= 1880 && width <= 1950 && height >= 950 && height <= 1250;
      setIsScreenSizeValid(isValid);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-reload every 10 minutes
  useEffect(() => {
    const reloadInterval = setInterval(() => {
      window.location.reload();
    }, 600000); // 10 minutes in milliseconds

    return () => clearInterval(reloadInterval);
  }, []);

  const handleNavClick = (page) => {
    setActivePage(page);
  };

  useEffect(() => {
    // Don't start auto-advance until configuration is loaded
    if (!configLoaded) return;
    
    const duration = pageDurations[activePage];
    console.log(`Active page: ${activePage}, Duration: ${duration}ms`);
    const timer = setTimeout(() => {
      const currentIndex = pages.indexOf(activePage)
      const nextIndex = (currentIndex + 1) % pages.length;
      console.log(`Advancing from ${activePage} to ${pages[nextIndex]}`);
      setActivePage(pages[nextIndex]);
    }, duration);
    return () => clearTimeout(timer);
  }, [activePage, configLoaded, portIds.length]); // Reset timer on manual click or config load

  // Don't render until configuration is loaded
  if (!configLoaded) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        <div className="flex gap-6">
          {/* Sidebar Skeleton */}
          <div className="w-20 bg-gray-100 rounded-2xl p-4 space-y-4 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-xl mx-auto"></div>
            <div className="space-y-3 pt-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 w-12 bg-gray-200 rounded-xl mx-auto"></div>
              ))}
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="flex-1 space-y-6">
            {/* Top Bar Skeleton */}
            <div className="bg-gray-100 rounded-2xl p-4 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>

            {/* Content Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl p-6 space-y-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Section Skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded-2xl p-6 space-y-3 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-gray-100 rounded-2xl p-6 space-y-3 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Clock Skeleton */}
        <div className="fixed bottom-8 right-8 bg-gray-100 rounded-2xl p-4 animate-pulse">
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
        </div>

        {/* Running Text Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  // If screen size is invalid, show warning message
  if (!isScreenSizeValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
        <div className="max-w-2xl text-center">
          <div className="mb-8">
            <svg className="w-24 h-24 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-4xl font-bold mb-4">Screen Size Not Supported</h1>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <p className="text-xl mb-4">
              {screenSize.width < 1880 || screenSize.height < 1020 
                ? "Your screen is too small" 
                : "Your screen is too big"}
            </p>
            <p className="text-gray-400 mb-2">Current screen size:</p>
            <p className="text-2xl font-mono text-blue-400 mb-4">
              {screenSize.width} × {screenSize.height}
            </p>
            <p className="text-gray-400 mb-2">Required screen size:</p>
            <p className="text-lg font-mono text-green-400">
              Width: 1850 - 1950 pixels<br />
              Height: 1020 - 1150 pixels
            </p>
          </div>
          <p className="text-black bg-yellow-400 rounded-lg p-4 font-semibold">
            Lakukan zoom in atau zoom out.
          </p>
        </div>
      </div>
    );
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
        <TopBar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} title={displayTitle} />


      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 pt-20 md:pt-15 lg:pt-18 overflow-y-auto z-10">

      <div>
        <div style={{ display: activePage === 'book' ? 'block' : 'none' }}>
            <BookPage theme={theme} />
        </div>
        <div style={{ display: activePage === 'weather' ? 'block' : 'none' }}>
            <WeatherPage theme={theme} list={portIds} />
        </div>
        <div style={{ display: activePage === 'cities' ? 'block' : 'none' }}>
            <PortPage theme={theme} portEndPoints={portEndPoints} />
        </div>
        <div style={{ display: activePage === 'Perairan' ? 'block' : 'none' }}>
            <PerairanPage 
              theme={theme} 
              isActive={activePage === 'Perairan'} 
              wilayahAktif={WILAYAH_AKTIF}
              viewPoint={view_point}
              initialZoom={initial_zoom}
              yourLocation={Your_location}
              labelPosition={labelPosition}
              individualPositions={individualPositions}
              connectorStartPositions={connectorStartPositions}
              waveLegendPosition={waveLegendPosition}
            />
      </div>
        <div style={{ display: activePage === 'Peta' ? 'block' : 'none' }}>
            <PetaPage theme={theme} />
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