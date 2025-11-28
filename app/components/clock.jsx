// app/components/clock.jsx
'use client';

import { useEffect, useState } from 'react';

export default function Clock({ theme, isDarkMode }) {
  const [formattedDateTime, setFormattedDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
      setFormattedDateTime(
        now.toLocaleString('id-ID', options).replace(',', ' pukul')
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`fixed bottom-10 md:bottom-0 right-0 z-50 px-4 py-2 rounded-tl-2xl text-center ${
        isDarkMode ? 'bg-black/50' : 'bg-white/50'
      } backdrop-blur-sm`}
    >
      <p className={`font-medium text-lg  ${theme.text.primary}`}>
        {formattedDateTime}
      </p>
    </div>
  );
}
