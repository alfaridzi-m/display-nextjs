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
  // --- Data Konfigurasi Awal Dihapus ---
  // Data ini sekarang akan diambil dari API

  // State untuk menyimpan data konfigurasi yang diambil dari API
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // State yang sudah ada
  const [activePage, setActivePage] = useState(null); // Diatur setelah config dimuat
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScreenSizeValid, setIsScreenSizeValid] = useState(true);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const theme = isDarkMode ? darkTheme : lightTheme;

  // --- PEMANGGILAN API ---
  useEffect(() => {
    const fetchConfig = async () => {
      // Ganti 'soekarno-hatta' dengan ID konfigurasi yang Anda inginkan
      const configId = 'soekarno-hatta'; 
      
      try {
        const response = await fetch(`/api/config/${configId}`);
        if (!response.ok) {
          throw new Error(`Gagal mengambil konfigurasi: ${response.statusText}`);
        }
        const data = await response.json();
        setConfig(data);
        setActivePage(data.pages[0]); // Atur halaman aktif pertama setelah data dimuat
      } catch (error) {
        console.error("Error fetching configuration:", error);
        setFetchError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []); // Dependensi kosong, dijalankan sekali saat komponen dimuat

  // Screen size validation (tidak berubah)
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({ width, height });

      // Catatan: Batasan tinggi di kode Anda tidak konsisten (950-1250 vs 1020-1150)
      // Saya menggunakan batasan dari pesan error (1020-1150)
      const isValid = width >= 1880 && width <= 1950 && height >= 1020 && height <= 1150;
      setIsScreenSizeValid(isValid);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // --- Mendapatkan Variabel Konfigurasi dari State ---
  // Gunakan optional chaining (?.) dan default values untuk menghindari error saat config masih null
  const pages = config?.pages || [];
  const portIds = config?.portIds || [];
  const portEndPoints = config?.portEndPoints || [];
  const WILAYAH_AKTIF = config?.WILAYAH_AKTIF || [];
  const view_point = config?.view_point || [-3.424, 128.9];
  const initial_zoom = config?.initial_zoom || 8;
  const Your_location = config?.Your_location || [-3.69375, 128.17733];
  const displayTitle = config?.displayTitle || 'Memuat...';

  // Durasi halaman dihitung setelah config dimuat
  const pageDurations = config ? {
    weather: (config.pageDurations?.weather || 1500000) * portIds.length,
    cities: config.pageDurations?.cities || 300000,
    Perairan: config.pageDurations?.Perairan || 1500000,
    Peta: config.pageDurations?.Peta || 6000000,
  } : {};

  const handleNavClick = (page) => {
    setActivePage(page);
  };

  // Page rotation effect (diperbarui agar aman)
  useEffect(() => {
    // Jangan jalankan timer jika config belum dimuat atau tidak ada halaman
    if (!config || !activePage || pages.length === 0) return;

    const duration = pageDurations[activePage];
    if (!duration) return; // Keamanan jika durasi tidak terdefinisi

    const timer = setTimeout(() => {
      const currentIndex = pages.indexOf(activePage);
      const nextIndex = (currentIndex + 1) % pages.length;
      setActivePage(pages[nextIndex]);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [activePage, config, pages, pageDurations]); // Tambahkan dependensi

  // Tampilkan pesan error jika screen size tidak valid
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
              {/* Logika pesan error ukuran layar disesuaikan dengan validasi */}
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

  // Tampilkan pesan loading saat mengambil data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-2xl">
        Memuat Konfigurasi...
      </div>
    );
  }

  // Tampilkan pesan error jika fetch gagal
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500 text-2xl">
        Error: {fetchError}
      </div>
    );
  }

  // Render halaman utama setelah data dimuat
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
          {/* Render konten halaman hanya jika config sudah dimuat */}
          {config && (
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
          )}
        </main>
        
        <Clock theme={theme} isDarkMode={isDarkMode} />
        <RunningText theme={theme} />
      </div>
    </>
  );
}

export default Display;