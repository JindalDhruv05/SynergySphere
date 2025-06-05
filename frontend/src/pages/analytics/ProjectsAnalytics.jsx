import React from 'react';
import {
  BuildingOfficeIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function ProjectsAnalytics({ data, formatCurrency, formatPercentage }) {
  if (!data) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Project analytics data is not available at the moment.</p>
      </div>
    );
  }

  const {
    summary = {},
    projects = [],
    projectCreationTrend = [],
    timeRange = 30
  } = data;

  const {
    activeProjects = 0,
    completedProjects = 0,
    averageProgress = 0,
    atRiskProjects = 0,
    totalBudget = 0,
    totalSpent = 0
  } = summary;

  // Prepare chart data
  const projectProgressData = projects.map(project => ({
    name: project.projectName?.substring(0, 20) + (project.projectName?.length > 20 ? '...' : '') || 'Unnamed Project',
    progress: project.completionRate || 0,
    budget: project.budgetUtilization || 0,
    totalTasks: project.totalTasks || 0,
    completedTasks: project.completedTasks || 0
  }));

  const budgetUtilizationData = projects
    .filter(p => p.totalBudget > 0)
    .map(project => ({
      name: project.projectName?.substring(0, 15) + (project.projectName?.length > 15 ? '...' : '') || 'Unnamed',
      budgetUsed: ((project.budgetUtilization || 0) / 100) * (project.totalBudget || 0),
      totalBudget: project.totalBudget || 0,
      utilization: project.budgetUtilization || 0
    }));

  const creationTrendData = projectCreationTrend.map(item => ({
    date: item._id,
    created: item.count || 0
  }));

  const projectCards = [
    {
      title: 'Active Projects',
      value: activeProjects,
      icon: BuildingOfficeIcon,
      trend: 'up',
      trendValue: '+3',
      color: 'bg-blue-500'
    },
    {
      title: 'Completed Projects',
      value: completedProjects,
      icon: CheckCircleIcon,
      trend: 'up',
      trendValue: '+2',
      color: 'bg-green-500'
    },
    {
      title: 'Average Progress',
      value: formatPercentage ? formatPercentage(averageProgress) : `${averageProgress.toFixed(1)}%`,
      icon: TrophyIcon,
      trend: 'up',
      trendValue: '+5%',
      color: 'bg-purple-500'
    },
    {
      title: 'At Risk Projects',
      value: atRiskProjects,
      icon: ExclamationTriangleIcon,
      trend: atRiskProjects > 0 ? 'down' : 'neutral',
      trendValue: atRiskProjects > 0 ? 'Attention needed' : 'All good',
      color: 'bg-red-500'
    },
    {
      title: 'Total Budget',
      value: formatCurrency ? formatCurrency(totalBudget) : `$${totalBudget.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      trend: 'up',
      trendValue: '+$50K',
      color: 'bg-indigo-500'
    }
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {projectCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(card.trend)}
                  <span className={`text-sm font-medium ${
                    card.trend === 'up' ? 'text-green-600' : 
                    card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {card.trendValue}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress Overview</h3>
          {projectProgressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectProgressData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="progress" fill="#3B82F6" name="Progress %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No project progress data available
            </div>
          )}
        </div>

        {/* Budget Utilization Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Utilization</h3>
          {budgetUtilizationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetUtilizationData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'budgetUsed' ? formatCurrency ? formatCurrency(value) : `$${value.toLocaleString()}` : value,
                    name === 'budgetUsed' ? 'Budget Used' : 'Total Budget'
                  ]}
                />
                <Bar dataKey="budgetUsed" fill="#10B981" name="Budget Used" />
                <Bar dataKey="totalBudget" fill="#E5E7EB" name="Total Budget" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No budget data available
            </div>
          )}
        </div>
      </div>

      {/* Project Creation Trend */}
      {creationTrendData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Creation Trend (Last {timeRange} days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={creationTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="created" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Project Details Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
        {projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.slice(0, 10).map((project, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {project.projectName || 'Unnamed Project'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(project.completionRate || 0, 100)}%` }}
                          />
                        </div>
                        <span>{(project.completionRate || 0).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.completedTasks || 0}/{project.totalTasks || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency ? formatCurrency(project.totalBudget || 0) : `$${(project.totalBudget || 0).toLocaleString()}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (project.completionRate || 0) === 100 
                          ? 'bg-green-100 text-green-800'
                          : (project.budgetUtilization || 0) > 80 && (project.completionRate || 0) < 80
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {(project.completionRate || 0) === 100 
                          ? 'Completed'
                          : (project.budgetUtilization || 0) > 80 && (project.completionRate || 0) < 80
                          ? 'At Risk'
                          : 'Active'
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p>No project details available</p>
          </div>
        )}
      </div>
    </div>
  );
}
