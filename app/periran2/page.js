'use client';

import React, { useState, useEffect } from 'react';
import WeatherPage from '../components/weatherpage';
import PortPage from '../components/portpage';
import Clock from '../components/clock';
import Sidebar from '../components/side-bar';
import RunningText from '../components/running-text';
import { lightTheme, darkTheme } from '../components/theme';
import PerairanPage from '../components/perairan';


const Display = () => {
  const pages = ['weather', 'cities', 'Perairan'];
  const portIds = ['AA005', 'AA003', 'AA006','AA007','AA001'];
  const pageDurations = {
    weather: 15000 * portIds.length,
    cities: 30000,
    Perairan: 3000000,
  }
  const [activePage, setActivePage] = useState(pages[0]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

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
            <PortPage theme={theme} />
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