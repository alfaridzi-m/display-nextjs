// atoms/Icon.jsx
export const Icon = ({ name, className = "h-5 w-5", color = "currentColor" }) => {
  const icons = {
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    map: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
      </svg>
    ),
    location: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    ),
    port: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 408.66 256.38" fill={color}>
        <path d="M408.66,147.14l-53.36,113.92c-1.77,3.18-3.73,5.83-7.3,7.07H27.77c-13.82-7.51-3.3-19.59.97-29.43,2.38-5.48,5.2-8.45,1.65-13.91-5.23-8.04-11.99-14.6-17.1-23.62-4.57-8.07-14.89-30.28-13.08-38.91.7-3.34,4.6-7.94,8.03-7.94h13.17v-34.73c-2.69-1.84-6.89-1.9-7.77-5.78-.66-2.9-.6-18.3.39-20.76s5.19-4.99,7.78-4.99h17.17v-45.91c0-2.26,5.28-6.79,7.59-6.79h26.75V6.22c0-5.07,6.42-8.22,10.36-4.77.58.5,2.41,4.32,2.41,4.77v29.14h26.75c2.58,0,7.59,4.91,7.59,7.59v45.11h17.17c2.59,0,6.76,2.45,7.78,4.99s1.06,17.96.25,20.6c-1.11,3.6-4.84,4.36-7.63,5.94v34.73h19.16V54.13c0-2.47,7.5-5.78,9.95-5.22,32.04,2.1,67.43-2.7,99.06,0,3.06.26,7.4.92,9.06,3.72.29.49,1.69,4.45,1.69,4.7v44.31h45.11c2.16,0,8.38,5.64,8.38,7.59v37.13l2.85-5.54c3.07-3.82,6.85-6.67,11.92-7.24,16.81-1.89,37.06,1.37,54.24.05,4.81,1.07,7.36,4.48,9.23,8.73v4.79ZM108.44,47.34h-57.49v40.72h57.49v-40.72ZM210.64,60.91h-41.52v40.72h41.52v-40.72ZM264.94,101.63v-39.52l-1.2-1.2h-41.12v40.72h42.32ZM133.99,100.84H25.41v6.39h14.77c.88,0,2.88,2.07,3.24,3.14,2.45,7.29-4.02,9.46-10.03,8.84v35.13h92.62v-35.13h-60.28c-.23,0-3.59-1.98-3.97-2.42-2.41-2.83-.9-9.56,2.37-9.56h69.86v-6.39ZM210.64,113.61h-41.52v40.72h41.52v-40.72ZM264.94,154.33v-39.52l-1.2-1.2h-41.12v40.72h42.32ZM318.43,113.61h-41.52v40.72h41.52v-40.72ZM395.88,145.55h-49.9c-3.73,0-3.67,7.97-4.63,10.54-1.39,3.73-8.21,10.22-12.14,10.22H12.63c3.79,21.14,16.56,38.93,30.07,54.96l231.46.09c8.92,2.95,4.53,12.72-4,12.04l-225.86-.06-10.91,23.19h310.19l10.78-23.15h-53.1c-.23,0-3.8-1.53-4.17-1.83-3.55-2.94-1.83-8.96,2.59-10.13l60.94-.15,35.26-75.72Z"/>
      </svg>
    ),
    settings: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
    check: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    circle: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
      </svg>
    ),
    arrowLeft: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
    ),
    close: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    eye: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      </svg>
    ),
    upload: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ),
    image: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={color}>
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
  };

  return icons[name] || null;
};
