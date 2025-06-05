import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeTestComponent = () => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, isDark } = useTheme();
  
  React.useEffect(() => {
    console.log('ThemeTestComponent - theme changed:', theme);
    console.log('ThemeTestComponent - isDark:', isDark);
    console.log('ThemeTestComponent - HTML classes:', document.documentElement.className);
  }, [theme, isDark]);

  const handleToggle = () => {
    console.log('ThemeTestComponent - Toggle button clicked');
    toggleTheme();
  };

  const handleSetLight = () => {
    console.log('ThemeTestComponent - Light button clicked');
    setLightTheme();
  };

  const handleSetDark = () => {
    console.log('ThemeTestComponent - Dark button clicked');
    setDarkTheme();
  };

  return (
    <div className="fixed top-4 left-4 p-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
      <h3 className="text-sm font-bold mb-2 text-gray-900 dark:text-white">Theme Test</h3>
      <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
        <div>Current: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{theme}</span></div>
        <div>isDark: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{isDark.toString()}</span></div>
        <div>HTML: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{document.documentElement.className || 'none'}</span></div>
      </div>
      <div className="flex gap-1 mt-3 flex-wrap">
        <button 
          onClick={handleToggle}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Toggle
        </button>
        <button 
          onClick={handleSetLight}
          className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
        >
          Light
        </button>
        <button 
          onClick={handleSetDark}
          className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
        >
          Dark
        </button>
      </div>
    </div>
  );
};

export default ThemeTestComponent;
