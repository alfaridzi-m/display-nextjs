import { Geist, Geist_Mono } from "next/font/google";
import './globals.css'; // Impor CSS global di sini
import "leaflet/dist/leaflet.css";

export const metadata = {
    title: 'Display Cuaca Maritim',
    description: 'Informasi Cuaca pelabuhan dan perairan',
};

export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <body>
              {children}
            </body>
        </html>
    );
}