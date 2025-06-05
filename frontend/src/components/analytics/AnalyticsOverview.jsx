import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function AnalyticsOverview({ timeRange, setLoading }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLocalLoading(true);
      setLoading && setLoading(true);
      setError(null);
      const response = await api.get(`/analytics/dashboard?timeRange=${timeRange}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLocalLoading(false);
      setLoading && setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  if (localLoading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const kpiCards = [
    {
      title: 'Total Projects',
      value: data.kpis.totalProjects,
      icon: ChartBarIcon,
      color: 'blue'
    },    {
      title: 'Active Tasks',
      value: data.kpis.activeTasks,
      icon: ClockIcon,
      color: 'green'
    },
    {
      title: 'Completed Tasks',
      value: data.kpis.completedTasks,
      icon: ChartBarIcon,
      color: 'purple'
    },
    {
      title: 'Overdue Tasks',
      value: data.kpis.overdueTasks,
      icon: ExclamationTriangleIcon,
      color: 'red'
    },
    {
      title: 'Total Budget',
      value: formatCurrency(data.kpis.totalBudget),
      icon: CurrencyDollarIcon,
      color: 'indigo'
    },
    {
      title: 'Total Spent',
      value: formatCurrency(data.kpis.totalSpent),
      icon: CurrencyDollarIcon,
      color: 'yellow'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50',
      green: 'bg-green-500 text-green-600 bg-green-50',
      purple: 'bg-purple-500 text-purple-600 bg-purple-50',
      red: 'bg-red-500 text-red-600 bg-red-50',
      indigo: 'bg-indigo-500 text-indigo-600 bg-indigo-50',
      yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50'
    };
    return colors[color];
  };

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const colorClass = getColorClasses(card.color);
          const [bgColor, textColor, bgLight] = colorClass.split(' ');
          
          return (
            <div key={index} className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${bgLight}`}>
                  <Icon className={`h-6 w-6 ${textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Utilization */}
      {data.kpis.totalBudget > 0 && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Utilization</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Budget Usage</span>
            <span className="text-sm text-gray-500">
              {data.kpis.budgetUtilization.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                data.kpis.budgetUtilization >= 100
                  ? 'bg-red-500'
                  : data.kpis.budgetUtilization >= 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(data.kpis.budgetUtilization, 100)}%` }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-sm text-gray-600">
            <span>Spent: {formatCurrency(data.kpis.totalSpent)}</span>
            <span>Budget: {formatCurrency(data.kpis.totalBudget)}</span>
          </div>
        </div>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-4">
            {data.insights.map((insight, index) => {
              const isPositive = insight.trend === 'up';
              const isWarning = insight.trend === 'warning';
              
              return (
                <div key={index} className={`p-4 rounded-md ${
                  isWarning ? 'bg-yellow-50 border border-yellow-200' : 
                  isPositive ? 'bg-green-50 border border-green-200' : 
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {isWarning ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                      ) : isPositive ? (
                        <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className={`text-sm font-medium ${
                        isWarning ? 'text-yellow-800' : 
                        isPositive ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {insight.title}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        isWarning ? 'text-yellow-700' : 
                        isPositive ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Task Updates</h3>
          {data.recentActivity.tasks.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.tasks.map((task) => (
                <div key={task._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.projectId?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      task.status === 'Done' ? 'bg-green-100 text-green-800' :
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent task updates</p>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h3>
          {data.recentActivity.expenses.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.expenses.map((expense) => (
                <div key={expense._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                    <p className="text-xs text-gray-500">{expense.projectId?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent expenses</p>
          )}
        </div>
      </div>
    </div>
  );
}
