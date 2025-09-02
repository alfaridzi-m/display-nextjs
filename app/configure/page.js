// app/configure/page.js
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Select from 'react-select';

// Dynamically import the map component to avoid SSR issues with Leaflet
const CoordinatePicker = dynamic(() => import('../components/CoordinatePicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-gray-700 animate-pulse rounded-md flex items-center justify-center">
      <p>Memuat peta...</p>
    </div>
  ),
});

// Dummy options for the port selector
const portOptions = [
  { value: 'AA001', label: 'Pelabuhan Tanjung Priok' },
  { value: 'AA004', label: 'Pelabuhan Merak' },
  { value: 'AA005', label: 'Pelabuhan Tanjung Perak (Surabaya)' },
  { value: 'AA006', label: 'Pelabuhan Soekarno-Hatta (Makassar)' },
  { value: 'AA007', label: 'Pelabuhan Belawan' },
  { value: 'AA008', label: 'Pelabuhan Ketapang' },
  { value: 'AA009', label: 'Pelabuhan Bakauheni' },
];

export default function ConfigurePage() {
  const [formData, setFormData] = useState({
    namaPelabuhan: '',
    lokasiPelabuhan: '',
    koordinat: null, // format: { lat: number, lng: number }
    pelabuhanTerpilih: [], // format: [{ value: string, label: string }]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoordinateChange = (latlng) => {
    setFormData((prev) => ({ ...prev, koordinat: { lat: latlng.lat, lng: latlng.lng } }));
  };

  const handlePortSelectChange = (selectedOptions) => {
    setFormData((prev) => ({ ...prev, pelabuhanTerpilih: selectedOptions }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the formData to your server/API to save it.
    console.log('Data to be saved:', formData);
    alert('Konfigurasi disimpan! (Cek console log untuk melihat data)');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Pengaturan Tampilan
            </h1>
            <p className="text-gray-400 mt-2">
                Atur informasi utama yang akan ditampilkan pada layar monitor Anda.
            </p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-8 bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/10">
          
          {/* Port Name Input */}
          <div>
            <label htmlFor="namaPelabuhan" className="block text-sm font-medium text-gray-300 mb-2">Nama Pelabuhan Display</label>
            <input
              type="text"
              name="namaPelabuhan"
              id="namaPelabuhan"
              value={formData.namaPelabuhan}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              placeholder="Contoh: Pelabuhan Utama Merak"
            />
          </div>

          {/* Port Location Input */}
          <div>
            <label htmlFor="lokasiPelabuhan" className="block text-sm font-medium text-gray-300 mb-2">Lokasi Pelabuhan</label>
            <input
              type="text"
              name="lokasiPelabuhan"
              id="lokasiPelabuhan"
              value={formData.lokasiPelabuhan}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              placeholder="Contoh: Cilegon, Banten"
            />
          </div>

          {/* Coordinate Picker Map */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Koordinat Display (Klik pada Peta)</label>
            <CoordinatePicker value={formData.koordinat} onChange={handleCoordinateChange} />
            <p className="text-xs text-gray-400 mt-2">
              Koordinat saat ini: {formData.koordinat ? `${formData.koordinat.lat.toFixed(5)}, ${formData.koordinat.lng.toFixed(5)}` : 'Belum dipilih'}
            </p>
          </div>

          {/* Port Multi-Selector */}
          <div>
            <label htmlFor="pelabuhanTerpilih" className="block text-sm font-medium text-gray-300 mb-2">Pilih Pelabuhan (Bisa lebih dari satu)</label>
            <Select
              isMulti
              name="pelabuhanTerpilih"
              options={portOptions}
              className="text-black"
              classNamePrefix="select"
              onChange={handlePortSelectChange}
              placeholder="Cari dan pilih pelabuhan..."
              // Custom styles for dark theme
              styles={{
                control: (base) => ({ ...base, backgroundColor: '#374151', borderColor: '#4B5563', padding: '0.25rem', borderRadius: '0.5rem' }),
                menu: (base) => ({ ...base, backgroundColor: '#1F2937', zIndex: 50 }),
                option: (base, { isFocused, isSelected }) => ({ ...base, color: 'white', backgroundColor: isFocused ? '#374151' : isSelected ? '#4B5563' : '#1F2937', ':active': {backgroundColor: '#4B5563'} }),
                multiValue: (base) => ({ ...base, backgroundColor: '#4B5563' }),
                multiValueLabel: (base) => ({ ...base, color: 'white' }),
                input: (base) => ({...base, color: 'white'}),
              }}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-white/10">
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
              Simpan Konfigurasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
