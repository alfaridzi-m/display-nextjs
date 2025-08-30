'use client';

import { useEffect, useState } from "react";
const Clock = ({ theme, isDarkMode }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const options = {
        weekday: 'long', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit', hour12: false
    };
    
    const formattedDateTime = new Intl.DateTimeFormat('id-ID', options).format(time).replace('.', ':');

    return (
        <div className={`fixed bottom-10 md:bottom-0 right-0 z-50 px-4 py-2 md:py-3 rounded-tl-2xl text-center ${isDarkMode ? 'bg-black/50' : 'bg-white/50' } backdrop-blur-sm`}>
            <p className={`font-semibold text-sm md:text-base ${theme.text.primary}`}>{formattedDateTime}</p>
        </div>
    );
};

export default Clock;