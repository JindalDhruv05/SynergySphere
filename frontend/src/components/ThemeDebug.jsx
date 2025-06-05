import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeDebug = () => {
  const { theme, isDark, isLight, toggleTheme, setLightTheme, setDarkTheme } = useTheme();
  const [htmlClasses, setHtmlClasses] = useState('');
  const [storageTheme, setStorageTheme] = useState('');

  useEffect(() => {
    const updateInfo = () => {
      setHtmlClasses(document.documentElement.className || 'none');
      setStorageTheme(localStorage.getItem('theme') || 'none');
    };

    updateInfo();
    
    // Watch for changes
    const observer = new MutationObserver(updateInfo);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const storageHandler = () => updateInfo();
    window.addEventListener('storage', storageHandler);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', storageHandler);
    };
  }, [theme]);

  return (
    <div className="fixed top-4 right-4 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg shadow-lg z-50 max-w-sm text-sm">
      <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">Theme Debug</h3>
      <div className="space-y-1 text-red-700 dark:text-red-300">
        <div>Context theme: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">{theme}</code></div>
        <div>isDark: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">{isDark.toString()}</code></div>
        <div>isLight: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">{isLight.toString()}</code></div>
        <div>HTML classes: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">{htmlClasses}</code></div>
        <div>localStorage: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">{storageTheme}</code></div>
      </div>
      <div className="flex gap-1 mt-3 flex-wrap">
        <button 
          onClick={toggleTheme}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Toggle
        </button>
        <button 
          onClick={setLightTheme}
          className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
        >
          Light
        </button>
        <button 
          onClick={setDarkTheme}
          className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
        >
          Dark
        </button>
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Clear & Reload
        </button>
      </div>
    </div>
  );
};

export default ThemeDebug;
