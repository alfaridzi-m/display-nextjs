// organisms/ConfigSummary.jsx
import { Icon } from '../atoms/Icon';
import { SummaryCard } from '../molecules/SummaryCard';

export const ConfigSummary = ({ formData }) => {
  return (
    <section className="mt-8 bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/10">
      <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 flex items-center gap-2">
        <Icon name="check" className="h-6 w-6 text-blue-400" />
        Ringkasan Konfigurasi
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Icon name="info" className="h-5 w-5 text-blue-400" />}
          title="ID & Nama"
          titleColor="text-blue-300"
          gradient="from-blue-900/20 to-blue-800/20"
          borderColor="border-blue-500/30"
          value={
            <>
              <p className="text-xs text-gray-400">ID: <span className="text-white">{formData.id || '-'}</span></p>
              <p className="text-xs text-gray-400 mt-1">Nama: <span className="text-white">{formData.displayTitle || '-'}</span></p>
            </>
          }
        />

        <SummaryCard
          icon={<Icon name="map" className="h-5 w-5 text-cyan-400" />}
          title="Wilayah"
          titleColor="text-cyan-300"
          gradient="from-cyan-900/20 to-cyan-800/20"
          borderColor="border-cyan-500/30"
          value={formData.wilayahAktif?.length || 0}
          subtitle="wilayah perairan"
          valueColor="text-cyan-400"
        />

        <SummaryCard
          icon={<Icon name="location" className="h-5 w-5 text-green-400" />}
          title="Lokasi"
          titleColor="text-green-300"
          gradient="from-green-900/20 to-green-800/20"
          borderColor="border-green-500/30"
          value={
            formData.yourLocation ? (
              <>
                <span className="text-green-400">✓ Sudah diatur</span>
                <br />
                <span className="text-white text-[10px]">
                  [{formData.yourLocation.lat.toFixed(2)}, {formData.yourLocation.lng.toFixed(2)}]
                </span>
              </>
            ) : (
              <span className="text-gray-500">Belum diatur</span>
            )
          }
        />

        <SummaryCard
          icon={<Icon name="port" className="h-5 w-5 text-purple-400" />}
          title="Pelabuhan"
          titleColor="text-purple-300"
          gradient="from-purple-900/20 to-purple-800/20"
          borderColor="border-purple-500/30"
          value={
            <>
              <p className="text-xs text-gray-400">Utama: <span className="text-blue-300 font-semibold">{formData.portIds?.length || 0}</span></p>
              <p className="text-xs text-gray-400 mt-1">Sekitar: <span className="text-green-300 font-semibold">{formData.portEndPoints?.length || 0}</span></p>
            </>
          }
        />
      </div>
    </section>
  );
};
