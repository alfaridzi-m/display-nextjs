'use client';
import { 
    Wind, 
    Droplets, 
    Compass, 
    Activity, 
    Thermometer, 
    Waves, 
    Navigation, 
    Navigation2,
    Sun,
    Cloud,
    Map,
    Book,
    Anchor,
    CheckCircle,
    XCircle,
    Info,
    AlertTriangle
} from 'lucide-react';
import Image from 'next/image';

const BookPage = ({ theme }) => {
    const weatherIcons = [
        { name: 'Cerah', file: 'Cerah.svg', description: 'Cuaca cerah tanpa awan' },
        { name: 'Cerah Berawan', file: 'Cerah-berawan.svg', description: 'Cuaca cerah dengan sedikit awan' },
        { name: 'Berawan', file: 'berawan.svg', description: 'Cuaca berawan' },
        { name: 'Berawan Tebal', file: 'Berawan-tebal.svg', description: 'Cuaca berawan tebal atau mendung' },
        { name: 'Udara Kabur', file: 'udara-kabur.svg', description: 'Udara kabur atau berkabut asap' },
        { name: 'Kabut', file: 'kabut.svg', description: 'Kondisi berkabut' },
        { name: 'Hujan Ringan', file: 'Hujan-ringan.svg', description: 'Hujan dengan intensitas ringan' },
        { name: 'Hujan Sedang', file: 'Hujan-sedang.svg', description: 'Hujan dengan intensitas sedang' },
        { name: 'Hujan Lebat', file: 'Hujan-lebat.svg', description: 'Hujan dengan intensitas lebat' },
        { name: 'Petir', file: 'Petir.svg', description: 'Petir atau kilat' },
        { name: 'Hujan Petir', file: 'Hujan-Petir.svg', description: 'Hujan disertai petir' }
    ];

    return (
        <div className="min-h-screen p-6 md:p-8">
            <div className=" mx-auto">
                <div className={`${theme.glassCardClass} backdrop-blur-md p-6 md:p-8`}>
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className={`text-4xl font-bold ${theme.text.primary} mb-2`}>
                            📖 Glosarium
                        </h1>
                        <p className={`${theme.text.secondary} text-lg`}>
                            Panduan simbol dan ikon yang digunakan dalam aplikasi
                        </p>
                    </div>

                    {/* Ikon Cuaca & Informasi (combined) */}
                    <div className="mb-12">
                        <h2 className={`text-2xl font-bold ${theme.text.primary} mb-6 flex items-center gap-2`}>
                            Ikon Cuaca & Informasi
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {weatherIcons.map((item, index) => (
                                <div 
                                    key={index}
                                    className={`${theme.glassCardClass} hover:scale-105 transition-all duration-300`}
                                >
                                    <div className="flex items-center gap-4 p-5">
                                        <div className={`${theme.bg.tertiary} rounded-lg p-3 flex items-center justify-center min-w-[64px] h-16`}>
                                            <Image 
                                                src={`/icon/weather-icon/${item.file}`}
                                                alt={item.name}
                                                width={48}
                                                height={48}
                                                className="object-contain"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`${theme.text.primary} font-semibold text-lg`}>
                                                {item.name}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Suhu Udara */}
                            <div className={`${theme.glassCardClass} hover:scale-105 transition-all duration-300`}>
                                <div className="flex items-center gap-4 p-5">
                                    <div className={`${theme.bg.tertiary} rounded-lg p-3 flex items-center justify-center min-w-[64px] h-16`}>
                                        <Thermometer className="w-10 h-10 text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`${theme.text.primary} font-semibold text-lg`}>Suhu Udara</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Angin */}
                            <div className={`${theme.glassCardClass} hover:scale-105 transition-all duration-300`}>
                                <div className="flex items-center gap-4 p-5">
                                    <div className={`${theme.bg.tertiary} rounded-lg p-3 flex items-center justify-center min-w-[64px] h-16`}>
                                        <Wind className="w-10 h-10 text-sky-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`${theme.text.primary} font-semibold text-lg`}>Kecepatan Angin</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Arah Angin */}
                            <div className={`${theme.glassCardClass} hover:scale-105 transition-all duration-300`}>
                                <div className="flex items-center gap-4 p-5">
                                    <div className={`${theme.bg.tertiary} rounded-lg p-3 flex items-center justify-center min-w-[64px] h-16`}>
                                        <Navigation2 className="w-10 h-10 text-sky-700" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`${theme.text.primary} font-semibold text-lg`}>Arah Angin</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Gelombang */}
                            <div className={`${theme.glassCardClass} hover:scale-105 transition-all duration-300`}>
                                <div className="flex items-center gap-4 p-5">
                                    <div className={`${theme.bg.tertiary} rounded-lg p-3 flex items-center justify-center min-w-[64px] h-16`}>
                                        <Waves className="w-10 h-10 text-blue-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`${theme.text.primary} font-semibold text-lg`}>Gelombang Laut</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Kelembapan Udara */}
                            <div className={`${theme.glassCardClass} hover:scale-105 transition-all duration-300`}>
                                <div className="flex items-center gap-4 p-5">
                                    <div className={`${theme.bg.tertiary} rounded-lg p-3 flex items-center justify-center min-w-[64px] h-16`}>
                                        <Droplets className="w-10 h-10 text-cyan-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`${theme.text.primary} font-semibold text-lg`}>Kelembapan</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Arus Laut */}
                            <div className={`${theme.glassCardClass} hover:scale-105 transition-all duration-300`}>
                                <div className="flex items-center gap-4 p-5">
                                    <div className={`${theme.bg.tertiary} rounded-lg p-3 flex items-center justify-center min-w-[64px] h-16`}>
                                        <Image 
                                            src="/icon/current.svg" 
                                            alt="Arus Laut" 
                                            width={40} 
                                            height={40}
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`${theme.text.primary} font-semibold text-lg`}>Arus Laut</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Pasang Surut */}
                            <div className={`${theme.glassCardClass} hover:scale-105 transition-all duration-300`}>
                                <div className="flex items-center gap-4 p-5">
                                    <div className={`${theme.bg.tertiary} rounded-lg p-3 flex items-center justify-center min-w-[64px] h-16`}>
                                        <Image 
                                            src="/icon/msl.svg" 
                                            alt="Tinggi Muka Air Laut" 
                                            width={40} 
                                            height={40}
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`${theme.text.primary} font-semibold text-lg`}>Tinggi Muka Air Laut</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookPage;