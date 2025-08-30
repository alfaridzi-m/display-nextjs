'use client'
const WaveFill = ({ animationDuration, theme, pageKey }) => (
    <div key={pageKey} className="absolute bottom-0 left-0 w-full h-full overflow-hidden rounded-lg z-0">
        <div 
            className="absolute w-full h-full"
            style={{ animation: `wave-fill ${animationDuration}s linear forwards`}}
        >
            <div className={`absolute w-[200%] h-[200%] -left-[50%] top-0 ${theme.nav.activeFill}`}
                style={{ 
                    animation: `wave-move 4s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite`,
                    borderRadius: '40%'
                }}
            ></div>
             <div className={`absolute w-[200%] h-[200%] -left-[50%] top-0 ${theme.nav.activeFill} opacity-70`}
                style={{ 
                    animation: `wave-move 6s cubic-bezier(0.36, 0.45, 0.63, 0.53) -.125s infinite`,
                    borderRadius: '40%'
                }}
            ></div>
        </div>
    </div>
);

export default WaveFill;