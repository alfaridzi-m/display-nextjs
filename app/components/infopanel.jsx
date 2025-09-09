import WeatherIcon from "./weather-icon";


const KATEGORI_GELOMBANG = {
  Tenang: { color: "bg-[#2793f2]", range: "0 - 0.5 m" },
  Sedang: { color: "bg-[#fff200]", range: "1.25 - 2.5 m" },
  Tinggi: { color: "bg-[#fd8436]", range: "2.5 - 4.0 m" },
  Rendah: { color: "bg-[#00d342]", range: "0.5 - 1.25 m" },
  'Sangat Tinggi': { color: "bg-[#fb0510]", range: "4.0 - 6.0 m" },
  Ekstrem: { color: "bg-[#ef38ce]", range: "6.0 - 9.0 m" },
  'Sangat Ekstrem': { color: "bg-[#000000]", range: "> 9.0 m"},
  unknown: { color: "bg-[#c1d4e3aa]", range: "N/A" }
};

const getColorForWaveCategory = (category) => {
  return KATEGORI_GELOMBANG[category]?.color || KATEGORI_GELOMBANG.unknown.color;
};
// Komponen Card individual untuk setiap wilayah
const ForecastCard = ({ regionId, regionName, forecast, theme }) => {
    
    // Tampilan jika tidak ada data prakiraan
    if (!forecast) {
        return (
            <div className={`p-3 rounded-lg ${theme.glassCardClass} flex flex-col justify-between h-full`}>
                <div>
                    <p className={`font-bold text-base ${theme.text.primary} truncate`} title={regionName || `Wilayah`}>{regionName || `Wilayah`}</p>
                    <p className={`text-xs font-mono ${theme.text.secondary}`}>{regionId}</p>
                </div>
                <p className={`text-sm text-center mt-4 ${theme.text.secondary}`}>Data tidak tersedia</p>
            </div>
        );
    }

    // Tampilan normal dengan data
    return (
        <div className={`p-3 rounded-lg ${theme.glassCardClass} flex flex-col justify-between h-full`}>
            <div>
                 <p className={`font-bold text-base ${theme.text.primary} truncate`} title={regionName || 'Wilayah'}>{regionName || 'Wilayah'}</p>
                 <p className={`text-xs font-mono ${theme.text.secondary}`}>{regionId}</p>
            </div>
            <div className="mt-3 space-y-2 ">
                 {/* Cuaca */}
                 <div className="flex items-center" title="Cuaca">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 shrink-0 ${theme.text.secondary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                    <span className={`text-sm ${theme.text.secondary} truncate`}>{forecast.weather}</span>
                 </div>
                 {/* Tinggi Gelombang */}
                 <div className="flex items-center" title="Tinggi Gelombang">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 shrink-0 ${theme.text.secondary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    <span className={`text-sm ${theme.text.secondary} truncate ${getColorForWaveCategory(forecast.wave_cat)}`}>{forecast.wave_height} m ({forecast.wave_cat})</span>
                 </div>
                 {/* Angin */}
                 <div className="flex items-center" title="Angin">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 shrink-0 ${theme.text.secondary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className={`text-sm ${theme.text.secondary} truncate`}>{forecast.wind_speed} knots dari {forecast.wind_from}</span>
                 </div>
            </div>
        </div>
    );
};


const InfoPanel = ({ activeRegions, allForecasts, currentTimeISO, waveCategories, theme, geojsonFeatures }) => {
    return (
        <div className="flex flex-col h-full">
            {/* Konten utama dengan kartu-kartu */}
            <div className="flex-grow overflow-y-auto pr-2">
                <h2 className={`text-2xl font-bold ${theme.text.primary} mb-4 sticky top-0 bg-opacity-80 backdrop-blur-sm py-2 z-10`}>
                    Prakiraan Wilayah Aktif
                </h2>
                
                {(!allForecasts || activeRegions.length === 0) ? (
                    <div className={`p-6 rounded-lg ${theme.glassCardClass} h-full flex items-center justify-center`}>
                        <p className={`${theme.text.secondary}`}>Memuat data prakiraan...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {activeRegions.map(regionId => {
                            const currentForecast = allForecasts[regionId]?.find(f => f.time.toISOString() === currentTimeISO);
                            const regionFeature = geojsonFeatures.find(f => f.properties.ID_MAR === regionId);
                            const regionName = regionFeature?.properties?.perairan;

                            return (
                                <ForecastCard 
                                    key={regionId}
                                    regionId={regionId}
                                    regionName={regionName}
                                    forecast={currentForecast}
                                    theme={theme}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Legenda di bagian bawah */}
            <div className={` mt-6 shrink-0 border-t pt-4 ${theme.border}`}>
                <h3 className={`text-lg font-semibold ${theme.text.primary} mb-2`}>Legenda Kategori Gelombang</h3>
                <ul className="flex flex-row flex-wrap">
                    {Object.entries(waveCategories).map(([category, { color, range }]) => 
                        category !== 'unknown' && (
                            <li key={category} className="flex items-center mb-1">
                                <span className="w-4 h-4 rounded-full mx-3" style={{ backgroundColor: color }}></span>
                                <span className={`${theme.text.primary} font-semibold w-28`}>{category}</span>
                                <span className={`${theme.text.secondary}`}>{range}</span>
                            </li>
                        )
                    )}
                </ul>
            </div>
        </div>
    );
};

export default InfoPanel;

