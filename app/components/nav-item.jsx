'use client';
import WaveFill from './wave-fill';

const NavItem = ({ icon: Icon, label, isActive, animationDuration, theme, onClick }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-20 h-20 overflow-hidden ${theme.nav.text}`}
  >
    {/* Animate only if it's the currently active page */}
    {isActive && <WaveFill animationDuration={animationDuration} theme={theme} pageKey={label} />}
    
    <div className={`relative z-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${isActive ? 'text-white' : theme.nav.text}`}>
        <Icon className="w-7 h-7 mb-1" />
        <span className="text-xs font-medium">{label}</span>
    </div>
  </button>
);

export default NavItem;