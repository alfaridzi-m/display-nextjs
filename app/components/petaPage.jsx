'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Map } from 'lucide-react';

const PetaPage = ({ theme = {} }) => {
    const videoWilpelRef = useRef(null);
    const videoSatRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadedVideos, setLoadedVideos] = useState({ wilpel: false, sat: false });

    useEffect(() => {
        // Auto-play videos when component mounts and videos are ready
        const wilpelVideo = videoWilpelRef.current;
        const satVideo = videoSatRef.current;

        const handleWilpelLoad = () => {
            setLoadedVideos(prev => ({ ...prev, wilpel: true }));
        };

        const handleSatLoad = () => {
            setLoadedVideos(prev => ({ ...prev, sat: true }));
        };

        const handleWilpelCanPlay = () => {
            if (wilpelVideo && wilpelVideo.paused) {
                wilpelVideo.play().catch(err => console.log('Wilpel autoplay prevented:', err));
            }
        };

        const handleSatCanPlay = () => {
            if (satVideo && satVideo.paused) {
                satVideo.play().catch(err => console.log('Sat autoplay prevented:', err));
            }
        };

        if (wilpelVideo) {
            wilpelVideo.addEventListener('loadeddata', handleWilpelLoad);
            wilpelVideo.addEventListener('canplay', handleWilpelCanPlay);
            // Try to play immediately if already loaded
            if (wilpelVideo.readyState >= 3) {
                handleWilpelCanPlay();
            }
        }
        if (satVideo) {
            satVideo.addEventListener('loadeddata', handleSatLoad);
            satVideo.addEventListener('canplay', handleSatCanPlay);
            // Try to play immediately if already loaded
            if (satVideo.readyState >= 3) {
                handleSatCanPlay();
            }
        }

        // Check if both videos are loaded
        if (loadedVideos.wilpel && loadedVideos.sat) {
            setIsLoading(false);
        }

        return () => {
            if (wilpelVideo) {
                wilpelVideo.removeEventListener('loadeddata', handleWilpelLoad);
                wilpelVideo.removeEventListener('canplay', handleWilpelCanPlay);
            }
            if (satVideo) {
                satVideo.removeEventListener('loadeddata', handleSatLoad);
                satVideo.removeEventListener('canplay', handleSatCanPlay);
            }
        };
    }, [loadedVideos]);

    return (
        <div className="w-full">
            {/* Header */}
            <div className={`mb-6 ${theme.glassCardClass} p-6 backdrop-blur-md shadow-lg`}>
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className={`text-3xl font-bold ${theme.text?.primary || 'text-white'}`}>
                            Peta Animasi Meteorologi
                        </h1>
                        <p className={`${theme.text?.secondary || 'text-gray-300'} mt-1`}>
                            Gelombang Signifikan dan Satelit Indonesia
                        </p>
                    </div>
                </div>
            </div>

            {/* Video Maps Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Video - Wilayah Pelabuhan */}
                <div className={`${theme.glassCardClass} overflow-hidden backdrop-blur-md shadow-lg`}>
                    <div className={`p-4 border-b ${theme.border || 'border-white/10'}`}>
                        <h2 className={`text-xl font-semibold ${theme.text?.primary || 'text-white'} flex items-center gap-2`}>
                            <Map className="w-5 h-5" />
                            Gelombang Signifikan Wilayah Indonesia
                        </h2>
                        <p className={`text-sm ${theme.text?.secondary || 'text-gray-300'} mt-1`}>
                            Animasi prakiraan cuaca wilayah pelabuhan
                        </p>
                    </div>
                    <div className="relative ">
                        <video
                            ref={videoWilpelRef}
                            className="w-full h-full object-contain"
                            loop
                            muted
                            autoPlay
                            playsInline
                            preload="metadata"
                        >
                            <source src="https://infomet.pusmar.id/public_api/video_wilpel/Indonesia.webm" type="video/webm" />
                            Browser Anda tidak mendukung video tag.
                        </video>
                    </div>
                </div>

                {/* Right Video - Satelit */}
                <div className={`${theme.glassCardClass} overflow-hidden backdrop-blur-md shadow-lg`}>
                    <div className={`p-4 border-b ${theme.border || 'border-white/10'}`}>
                        <h2 className={`text-xl font-semibold ${theme.text?.primary || 'text-white'} flex items-center gap-2`}>
                            <Map className="w-5 h-5" />
                            Citra Satelit Indonesia
                        </h2>
                        <p className={`text-sm ${theme.text?.secondary || 'text-gray-300'} mt-1`}>
                            Animasi citra satelit terkini
                        </p>
                    </div>
                    <div className="relative">
                        <video
                            ref={videoSatRef}
                            className="w-full h-full object-contain"
                            loop
                            muted
                            autoPlay
                            playsInline
                            preload="metadata"
                        >
                            <source src="https://infomet.pusmar.id/public_api/video_sat.webm" type="video/webm" />
                            Browser Anda tidak mendukung video tag.
                        </video>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PetaPage;
