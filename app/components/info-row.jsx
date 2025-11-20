import { Wind, Droplets, Compass,Activity,Thermometer, Navigation2 , Waves } from 'lucide-react';
export default function InfoRow({ icon: Icon, label, value, sub, big = false, theme, customIcon, waveColor, iconColor }) {
  return (
    <div className="flex flex-col items-center justify-center text-center flex-1 p-2">
      <p className={`text-md ${theme.text.secondary}`}>{label}</p>
      {customIcon ? (
        <div className={`mb-2 ${big ? "w-12 h-12" : "w-8 h-8"} flex items-center justify-center`}>
          {customIcon}
        </div>
      ) : (
        <Icon className={`mb-2 ${big ? "w-12 h-12" : "w-8 h-8"} ${iconColor || waveColor || theme.text.secondary}`} />
      )}
      {sub && <p className={`text-md ${theme.text.secondary} mb-1`}>{sub}</p>}
      <p className={`${big ? "text-2xl" : "text-base"} font-bold ${theme.text.primary}`}>{value}</p>
    </div>
  );
}