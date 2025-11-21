// organisms/ActionButtons.jsx
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export const ActionButtons = ({ 
  setShowPreview,
  handleSaveToAPI,
  handleUpdateToAPI,
  handleLoadAllConfigs
}) => {
  return (
    <section className="mt-8 w-1/2 flex justify-center flex-col mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Preview */}
        <button 
          type="button" 
          onClick={() => setShowPreview(true)} 
          className="px-6 py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
        >
          <Icon name="eye" className="h-6 w-6" />
          <div className="text-left">
            <div>Preview Dashboard</div>
            <div className="text-xs opacity-80">Lihat hasil konfigurasi</div>
          </div>
        </button>

        {/* Save to Server */}
        <button 
          type="button" 
          onClick={handleSaveToAPI} 
          className="px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
          </svg>
          <div className="text-left">
            <div>Simpan ke Server</div>
            <div className="text-xs opacity-80">Menambahkan Konfigurasi</div>
          </div>
        </button>

        {/* Update to Server */}
        <button 
          type="button" 
          onClick={handleUpdateToAPI} 
          className="px-6 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2h-1.528A6 6 0 004 9.528V4z" />
            <path fillRule="evenodd" d="M8 10a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 108 10zm-2 4a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
          </svg>
          <div className="text-left">
            <div>Perbarui Data</div>
            <div className="text-xs opacity-80">Menyimpan perubahan konfigurasi</div>
          </div>
        </button>

        {/* View All Configs
        <button 
          type="button" 
          onClick={handleLoadAllConfigs} 
          className="px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 md:col-span-2 lg:col-span-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          <div className="text-left">
            <div>Lihat Semua Konfigurasi</div>
            <div className="text-xs opacity-80">Daftar tersimpan</div>
          </div>
        </button> */}
      </div>
    </section>
  );
};
