'use client';

import React, { useState, useEffect } from 'react';
import WeatherPage from '../components/weatherpage';
import PortPage from '../components/portpage';
import Clock from '../components/clock';
import Sidebar from '../components/side-bar';
import RunningText from '../components/running-text';
import { lightTheme, darkTheme } from '../components/theme';
import PerairanPage from '../components/perairan';
import PetaPage from '../components/petaPage';
import TopBar from '../components/top-bar';

const Display = () => {
  const pages = ['weather', 'cities', 'Perairan', 'Peta'];
  const portIds = ['AA005', 'AA003', 'AA006','AA007','AA001'];
  const portEndPoints = ['AA002','AA004', 'AA005', 'AA006', 'AA007','AA008', 'AA009','AA010','AA011'];
  const WILAYAH_AKTIF = ['P.AH.01','P.AH.02','P.AH.03','P.AH.04','P.AH.05','P.AH.06','P.AH.07','P.AH.08','P.AH.09'];
  const view_point = [-3.424, 128.9];
  const initial_zoom = 8;
  const Your_location = [-3.69375, 128.17733];
  const displayTitle = 'Display Cuaca Pelabuhan Soekarno Hatta';
  
  const pageDurations = {
    weather: 1500000 * portIds.length,
    cities: 300000,
    Perairan: 1500000,
    Peta: 6000000,
  }
  const [activePage, setActivePage] = useState(pages[0]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScreenSizeValid, setIsScreenSizeValid] = useState(true);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const theme = isDarkMode ? darkTheme : lightTheme;

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
              Width: 1880 - 1950 pixels<br />
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