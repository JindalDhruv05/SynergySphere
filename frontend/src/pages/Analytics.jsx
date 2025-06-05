import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProductivityAnalytics from '../components/analytics/ProductivityAnalytics';
import ProjectPerformanceAnalytics from '../components/analytics/ProjectPerformanceAnalytics';
import ResourceUtilizationAnalytics from '../components/analytics/ResourceUtilizationAnalytics';
import TeamPerformanceAnalytics from '../components/analytics/TeamPerformanceAnalytics';
import AnalyticsOverview from '../components/analytics/AnalyticsOverview';
import api from '../services/api';
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(false);

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: PresentationChartLineIcon,
      description: 'Key insights and trends'
    },
    {
      id: 'productivity',
      name: 'Productivity',
      icon: ChartBarIcon,
      description: 'Task completion and efficiency metrics'
    },
    {
      id: 'projects',
      name: 'Project Performance',
      icon: ClockIcon,
      description: 'Project progress and completion rates'
    },
    {
      id: 'resources',
      name: 'Resource Utilization',
      icon: CurrencyDollarIcon,
      description: 'Budget usage and expense tracking'
    },    {
      id: 'team',
      name: 'Team Performance',
      icon: UserGroupIcon,
      description: 'Team collaboration and performance'
    }
  ];

  const timeRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 3 months' },
    { value: '365', label: 'Last year' }
  ];

  const renderActiveComponent = () => {
    const commonProps = { timeRange, setLoading };
    
    switch (activeTab) {
      case 'overview':
        return <AnalyticsOverview {...commonProps} />;
      case 'productivity':
        return <ProductivityAnalytics {...commonProps} />;
      case 'projects':
        return <ProjectPerformanceAnalytics {...commonProps} />;
      case 'resources':
        return <ResourceUtilizationAnalytics {...commonProps} />;
      case 'team':
        return <TeamPerformanceAnalytics {...commonProps} />;
      default:
        return <AnalyticsOverview {...commonProps} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gain powerful insights into your productivity, project performance, and resource utilization
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block w-full sm:w-auto border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`-ml-0.5 mr-2 h-5 w-5 ${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-400 font-normal">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>          {/* Content Area */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading analytics data...</p>
                </div>
              </div>
            ) : (
              renderActiveComponent()
            )}
          </div>
        </div>

        {/* Insights Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            💡 Data-Driven Insights
          </h2>
          <p className="text-gray-600 mb-4">
            Use these analytics to identify patterns, optimize workflows, and make informed decisions:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span><strong>Productivity Trends:</strong> Monitor task completion rates to identify peak performance periods</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span><strong>Budget Management:</strong> Track spending against budgets to prevent overruns</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span><strong>Resource Optimization:</strong> Identify bottlenecks and redistribute workload efficiently</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span><strong>Team Performance:</strong> Understand collaboration patterns and individual contributions</span>
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
