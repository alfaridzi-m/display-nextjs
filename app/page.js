'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  const handleInfometClick = () => {
    router.push('/infomet');
  };

  const handleSisfometClick = () => {
    // Will be implemented in the future
    console.log('Sisfomet page coming soon');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-12">
          Selamat datang di Display Cuaca Maritim
        </h1>
        
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <button
            onClick={handleInfometClick}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 min-w-[200px]"
          >
            Infomet
          </button>
          
          <button
            onClick={handleSisfometClick}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 min-w-[200px]"
          >
            Sisfomet
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;