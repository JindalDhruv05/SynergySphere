import React from 'react';
import { useTheme } from '../context/ThemeContext';
import DashboardLayout from '../components/layout/DashboardLayout';

const Settings = () => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, isDark } = useTheme();
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your application preferences and settings.
            </p>
          </div>

          {/* Settings Cards */}
          <div className="space-y-6">
            {/* Appearance Settings */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Appearance
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Customize how the application looks and feels.
                </p>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {/* Theme Selection */}
                  <div>
                    <label className="text-base font-medium text-gray-900 dark:text-white">
                      Theme
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose your preferred theme for the application.
                    </p>
                    
                    <div className="mt-4 space-y-3">
                      {/* Light Theme Option */}
                      <div className="flex items-center">                        <input
                          id="light-theme"
                          name="theme"
                          type="radio"
                          checked={theme === 'light'}
                          onChange={() => setLightTheme()}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <div className="ml-3 flex items-center">
                          <label htmlFor="light-theme" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Light
                          </label>
                          <div className="ml-3 flex items-center space-x-1">
                            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                          </div>
                        </div>
                      </div>

                      {/* Dark Theme Option */}
                      <div className="flex items-center">                        <input
                          id="dark-theme"
                          name="theme"
                          type="radio"
                          checked={theme === 'dark'}
                          onChange={() => setDarkTheme()}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <div className="ml-3 flex items-center">
                          <label htmlFor="dark-theme" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Dark
                          </label>
                          <div className="ml-3 flex items-center space-x-1">
                            <div className="w-4 h-4 bg-gray-800 border border-gray-600 rounded"></div>
                            <div className="w-4 h-4 bg-gray-900 border border-gray-600 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>                  {/* Quick Toggle Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <button
                        onClick={toggleTheme}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                      >
                        {isDark ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Switch to Light Mode
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            Switch to Dark Mode
                          </>
                        )}
                      </button>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current theme: <span className="font-semibold capitalize">{theme}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Settings Placeholder */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Manage your notification preferences.
                </p>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-base font-medium text-gray-900 dark:text-white">
                        Email Notifications
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive notifications via email
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bg-gray-200 dark:bg-gray-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                      role="switch"
                      aria-checked="true"
                    >
                      <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-base font-medium text-gray-900 dark:text-white">
                        Push Notifications
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bg-primary-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                      role="switch"
                      aria-checked="true"
                    >
                      <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
