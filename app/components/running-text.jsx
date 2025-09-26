'use client';
import React, { useEffect, useRef, useState } from "react";

// A default theme is defined to prevent errors if the theme prop is missing or incomplete.

/**
 * RunningText (BMKG Gempa) - Simplified CSS Animation Version
 *
 * This version uses a more performant and maintainable CSS animation approach
 * for the marquee effect.
 *
 * @param {object} theme - The theme object for styling.
 * @param {number} speed - The scroll speed in pixels per second.
 * @param {number} gap - The gap between repeated text elements in pixels.
 * @param {boolean} pauseOnHover - Whether to pause the animation on mouse hover.
 */
function RunningText({ theme, speed = 90 /* px per second */, gap = 60, pauseOnHover = true }) {
  const [message, setMessage] = useState("Memuat informasi gempa terkini...");
  const [animationDuration, setAnimationDuration] = useState(20); // A sensible default duration

  const contentRef = useRef(null);

  // 1. Fetch data from BMKG using the native fetch API.
  useEffect(() => {
    const fetchEarthquakeData = async () => {
      try {
        const response = await fetch("https://bmkg-content-inatews.storage.googleapis.com/datagempa.json");
        if (!response.ok) {
          throw new Error(`Network response was not ok (status: ${response.status})`);
        }
        
        const data = await response.json();
        const infoGempa = data?.info;
        
        if (infoGempa?.description && infoGempa?.instruction) {
          const combinedText = `--- Akses lebih mudah melalui maritim.bmkg.go.id --- ${infoGempa.description} --- ${infoGempa.instruction}`;
          setMessage(combinedText);
        } else {
          setMessage("Format data gempa tidak sesuai.");
        }
      } catch (error) {
        console.error("Gagal mengambil data gempa:", error);
        setMessage("Gagal memuat informasi gempa. Silakan coba lagi nanti.");
      }
    };

    fetchEarthquakeData();
    // Set up an interval to refetch the data periodically.
    const intervalId = setInterval(fetchEarthquakeData, 300_000); // every 5 minutes

    // Cleanup interval on component unmount.
    return () => clearInterval(intervalId);
  }, []);

  // 2. Calculate the animation duration based on the content's width and desired speed.
  useEffect(() => {
    if (contentRef.current) {
      const contentWidth = contentRef.current.offsetWidth;
      // Ensure speed is positive to avoid division by zero.
      if (speed > 0) {
        const duration = (contentWidth + gap) / speed;
        setAnimationDuration(duration);
      }
    }
  }, [message, speed, gap]);

  return (
    <>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0%); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .pause-on-hover:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
      
      <div
        className={`fixed bottom-20 md:bottom-0 left-0 w-full h-10 flex items-center z-20 ${theme.sidebar} backdrop-blur-xl overflow-hidden ${pauseOnHover ? 'pause-on-hover' : ''}`}
        role="status"
        aria-live="polite"
      >
        <div
          className="flex flex-shrink-0 animate-marquee"
          style={{ animationDuration: `${animationDuration}s` }}
        >
          <span ref={contentRef} className={`text-lg font-medium whitespace-nowrap ${theme.text.primary}`} style={{ paddingRight: `${gap}px` }}>
            {message}
          </span>
          <span className={`text-lg font-medium whitespace-nowrap ${theme.text.primary}`} style={{ paddingRight: `${gap}px` }} aria-hidden="true">
            {message}
          </span>
        </div>
      </div>
    </>
  );
}

export default RunningText;
