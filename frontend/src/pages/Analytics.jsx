import { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../services/api';
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TrophyIcon,
  CheckCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import DashboardOverview from './analytics/DashboardOverview';
import PersonalPerformance from './analytics/PersonalPerformance';
import ProjectsAnalytics from './analytics/ProjectsAnalytics';
import TeamAnalytics from './analytics/TeamAnalytics';
import BudgetAnalytics from './analytics/BudgetAnalytics';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const tabs = [
    {
      id: 'overview',
      name: 'Dashboard Overview',
      icon: PresentationChartLineIcon,
      description: 'Key insights and performance summary'
    },
    {
      id: 'personal',
      name: 'My Performance',
      icon: TrophyIcon,
      description: 'Personal productivity and task metrics'
    },
    {
      id: 'projects',
      name: 'My Projects',
      icon: BuildingOfficeIcon,
      description: 'Projects I lead and participate in'
    },
    {
      id: 'team',
      name: 'Team Performance',
      icon: UserGroupIcon,
      description: 'Team collaboration and productivity'
    },
    {
      id: 'budget',
      name: 'Budget & Expenses',
      icon: CurrencyDollarIcon,
      description: 'Budget tracking and expense analysis'
    }
  ];

  const timeRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 3 months' },
    { value: '365', label: 'Last year' }
  ];

  // Fetch all analytics data once and cache it
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
        // Fetch all analytics data in parallel
      const [
        dashboardRes,
        productivityRes,
        projectsRes,
        teamRes,
        budgetRes
      ] = await Promise.all([
        api.get(`/analytics/dashboard?timeRange=${timeRange}`),
        api.get(`/analytics/productivity?timeRange=${timeRange}`),
        api.get(`/analytics/project-performance?timeRange=${timeRange}`),
        api.get(`/analytics/team-performance?timeRange=${timeRange}`),
        api.get(`/analytics/resource-utilization?timeRange=${timeRange}`)
      ]);

      setAnalyticsData({
        dashboard: dashboardRes.data,
        productivity: productivityRes.data,
        projects: projectsRes.data,
        team: teamRes.data,
        budget: budgetRes.data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }, []);

  // Format percentage
  const formatPercentage = useCallback((value) => {
    return `${(value || 0).toFixed(1)}%`;
  }, []);

  // Get trend color
  const getTrendColor = useCallback((trend) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  // Memoized components based on active tab
  const renderContent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500 text-lg">Loading analytics data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!analyticsData) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <DashboardOverview data={analyticsData.dashboard} formatCurrency={formatCurrency} />;
      case 'personal':
        return <PersonalPerformance data={analyticsData.productivity} formatPercentage={formatPercentage} />;
      case 'projects':
        return <ProjectsAnalytics data={analyticsData.projects} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />;
      case 'team':
        return <TeamAnalytics data={analyticsData.team} formatPercentage={formatPercentage} />;
      case 'budget':
        return <BudgetAnalytics data={analyticsData.budget} formatCurrency={formatCurrency} />;
      default:
        return <DashboardOverview data={analyticsData.dashboard} formatCurrency={formatCurrency} />;
    }
  }, [activeTab, loading, error, analyticsData, formatCurrency, formatPercentage, fetchAnalyticsData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive insights into your productivity, projects, team performance, and budget
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
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
            
            {/* Refresh Button */}
            <button
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
          </div>

          {/* Content Area */}
          <div className="p-6">
            {renderContent}
          </div>
        </div>

        {/* Data Freshness Indicator */}
        {analyticsData && (
          <div className="text-center text-sm text-gray-500">
            <p>Data last updated: {new Date(analyticsData.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
