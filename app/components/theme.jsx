'use client';

// --- Definisi Tema ---
const lightTheme = {
  gradient: "bg-gradient-to-br from-sky-400 to-blue-600",
  background: {
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmVhY2h8ZW58MHx8MHx8fDA%3D",
  },
  overlay: "bg-cyan-500/20",
  overlay2: "bg-sky-400/30",
  sidebar: "bg-sky-100/20 border-white/30",
  glassCardClass: "bg-white/70 border-white/40 shadow-lg rounded-3xl",
  text: { primary: "text-slate-900", secondary: "text-slate-900", placeholder: "placeholder-slate-500" },
  nav: { text: "text-sky-800", hoverBg: "bg-white/50", activeFill: "bg-sky-500/80" },
  border: "border-slate-800/10",
  bg: { primary: "bg-white/70", secondary: "bg-white/50", tertiary: "bg-white/30" }
};

const darkTheme = {
  background: {
    image: "https://i.guim.co.uk/img/media/327aa3f0c3b8e40ab03b4ae80319064e401c6fbc/377_133_3542_2834/master/3542.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=34d32522f47e4a67286f9894fc81c863",
  },
  overlay: "bg-blue-900/40",
  overlay2: "bg-gray-900/50",
  sidebar: "bg-gray-900/30 border-white/10",
  glassCardClass: "bg-gray-800/40 border-white/10 shadow-lg rounded-3xl",
  text: { primary: "text-white", secondary: "text-gray-300", placeholder: "placeholder-gray-400" },
  nav: { text: "text-gray-300", hoverBg: "bg-white/10", activeFill: "bg-blue-600/80" },
  bg: { primary: "bg-gray-800/40", secondary: "bg-gray-800/30", tertiary: "bg-gray-800/20" },
  border: "border-white/10"
};

export { lightTheme, darkTheme };
