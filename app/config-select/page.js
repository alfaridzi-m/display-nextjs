'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Download, ArrowRight, Loader2 } from 'lucide-react';

export default function ConfigSelectPage() {
  const router = useRouter();
  const [availableConfigs, setAvailableConfigs] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch all available configurations
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configure');
      const result = await response.json();
      
      if (result.success) {
        setAvailableConfigs(result.data || []);
      } else {
        setError('Failed to load configurations');
      }
    } catch (err) {
      console.error('Error fetching configurations:', err);
      setError('Error loading configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfiguration = () => {
    // Navigate to configure page to create new configuration
    router.push('/configure');
  };

  const handleLoadConfiguration = async () => {
    if (!selectedConfigId) {
      setError('Please select a configuration');
      return;
    }

    try {
      setLoadingConfig(true);
      setError('');
      
      // Verify the configuration exists
      const response = await fetch(`/api/configure?id=${selectedConfigId}`);
      const result = await response.json();
      
      if (result.success) {
        // Store the ID in localStorage
        localStorage.setItem('displayConfigId', selectedConfigId);
        
        // Redirect to home page
        router.push('/perairan3');
      } else {
        setError('Configuration not found');
      }
    } catch (err) {
      console.error('Error loading configuration:', err);
      setError('Error loading configuration');
    } finally {
      setLoadingConfig(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      <div className="relative z-10 max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Konfigurasi Display
          </h1>
          <p className="text-blue-200 text-lg">
            Pilih konfigurasi yang akan digunakan atau buat konfigurasi baru
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create New Configuration Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex flex-col items-center text-center h-full">
              <div className="bg-blue-500/20 rounded-full p-6 mb-6">
                <Settings className="w-16 h-16 text-blue-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Membuat Konfigurasi
              </h2>
              <p className="text-blue-200 mb-6 flex-grow">
                Buat konfigurasi baru dengan menentukan pengaturan display, lokasi, dan wilayah yang akan ditampilkan
              </p>
              <button
                onClick={handleCreateConfiguration}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Buat Konfigurasi Baru
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Load Existing Configuration Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex flex-col items-center text-center h-full">
              <div className="bg-green-500/20 rounded-full p-6 mb-6">
                <Download className="w-16 h-16 text-green-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Load Konfigurasi
              </h2>
              <p className="text-blue-200 mb-6">
                Pilih dan muat konfigurasi yang sudah tersimpan
              </p>

              <div className="flex-grow">
                <label className="block text-blue-200 mb-2 text-sm font-medium">
                  Masukkan ID Konfigurasi
                </label>
                <input
                  type="text"
                  value={selectedConfigId}
                  onChange={(e) => {
                    setSelectedConfigId(e.target.value);
                    setError('');
                  }}
                  placeholder="Contoh: s1997"
                  className="w-full bg-white/10 border border-white/30 text-white placeholder-gray-400 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />

                {error && (
                  <div className="text-red-300 text-sm mb-4 bg-red-500/20 px-4 py-2 rounded-lg">
                    {error}
                  </div>
                )}
              </div>

              <button
                onClick={handleLoadConfiguration}
                disabled={!selectedConfigId || loadingConfig}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loadingConfig ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  <>
                    Load Konfigurasi
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-8 text-center">
          <p className="text-blue-300 text-sm">
            Konfigurasi yang dimuat akan disimpan di browser ini
          </p>
        </div>
      </div>
    </div>
  );
}
