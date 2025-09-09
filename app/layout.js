import { Geist, Geist_Mono } from "next/font/google";
import './globals.css'; // Impor CSS global di sini
import "leaflet/dist/leaflet.css";

export const metadata = {
    title: 'Aplikasi Cuaca Maritim',
    description: 'Prakiraan cuaca maritim oleh BMKG',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
              {children}
            </body>
        </html>
    );
}