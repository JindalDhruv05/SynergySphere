import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeDebugger = () => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, isDark, isLight } = useTheme();
  const [htmlClass, setHtmlClass] = useState('');

  // Update HTML class display in real-time
  useEffect(() => {
    const updateHtmlClass = () => {
      setHtmlClass(document.documentElement.className || 'none');
    };
    
    updateHtmlClass();
    
    // Create a MutationObserver to watch for class changes
    const observer = new MutationObserver(updateHtmlClass);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const clearStorage = () => {
    localStorage.removeItem('theme');
    window.location.reload();
  };

  const forceLight = () => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    setLightTheme();
  };

  const forceDark = () => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    setDarkTheme();
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
      <h3 className="text-sm font-bold mb-2 text-gray-900 dark:text-white">Theme Debug</h3>
      <div className="space-y-2 text-xs">
        <div className="text-gray-700 dark:text-gray-300">
          Current: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{theme}</span>
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          isDark: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{isDark.toString()}</span>
        </div>        <div className="text-gray-700 dark:text-gray-300">
          HTML class: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{htmlClass}</span>
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          localStorage: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{localStorage.getItem('theme') || 'null'}</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={toggleTheme} className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
            Toggle
          </button>
          <button onClick={forceLight} className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600">
            Force Light
          </button>
          <button onClick={forceDark} className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600">
            Force Dark
          </button>
          <button onClick={clearStorage} className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
            Clear & Reload
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeDebugger;
