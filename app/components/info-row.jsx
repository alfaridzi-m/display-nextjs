import { Wind, Droplets, Compass,Activity,Thermometer, Navigation, Waves } from 'lucide-react';
export default function InfoRow({ icon: Icon, label, value, sub, big = false, theme }) {
  return (
    <div className="flex flex-col items-center justify-center text-center flex-1 p-2">
      <p className={`text-sm ${theme.text.secondary}`}>{label}</p>
      <Icon className={`mb-2 ${big ? "w-12 h-12" : "w-8 h-8"} ${theme.text.secondary}`} />
      <p className={`${big ? "text-2xl" : "text-base"} font-bold ${theme.text.primary}`}>{value}</p>
      {sub && <p className={`text-xs ${theme.text.secondary}`}>{sub}</p>}
    </div>
  );
}