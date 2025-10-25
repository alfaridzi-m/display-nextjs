'use client';

import { lightTheme, darkTheme } from './theme';

const TopBar = ({ isDarkMode, title }) => {
    const theme = isDarkMode ? darkTheme : lightTheme;

    return (
        <div className={`${theme.sidebar} backdrop-blur-xl p-3 flex items-center justify-between fixed top-0 left-0 md:left-24 right-0 w-fit z-40 shadow-xl rounded-r-lg`}>
            <div className="flex items-center gap-3">
                <h1 className={`text-xl md:text-2xl font-bold ${theme.nav.text}`}>
                    {title}
                </h1>
            </div>
        </div>
    );
};

export default TopBar;