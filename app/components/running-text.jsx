'use client';
import { useEffect, useState } from "react";
import axios from "axios";

const RunningText = ({ theme }) => {
    const [runningText, setRunningText] = useState('Memuat informasi gempa terkini...');

    useEffect(() => {
        const fetchEarthquakeData = async () => {
            try {
                const response = await axios.get('https://bmkg-content-inatews.storage.googleapis.com/datagempa.json');
                const infoGempa = response.data.info;
                const combinedText = `--- ${infoGempa.description} --- ${infoGempa.instruction}`;
                setRunningText(combinedText);
            } catch (error) {
                console.error("Gagal mengambil data gempa:", error);
                setRunningText("Gagal memuat informasi gempa. Silakan coba lagi nanti.\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0");
            }
        };

        fetchEarthquakeData();
        const intervalId = setInterval(fetchEarthquakeData, 300000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className={`fixed bottom-20 md:bottom-0 left-0 w-full h-10 flex items-center z-20 ${theme.sidebar} backdrop-blur-xl`}>
            <div className="w-full overflow-hidden whitespace-nowrap">
                <div className="inline-block" style={{ animation: 'scroll 20s linear infinite' }}>
                    <span className={`text-lg font-medium ${theme.text.primary}`}>{runningText}</span>
                    <span className={`text-lg font-medium ${theme.text.primary}`}>{runningText}</span>
                </div>
            </div>
        </div>
    );
};

export default RunningText;
