import React from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  TrophyIcon
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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function DashboardOverview({ data, formatCurrency }) {
  if (!data) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Dashboard data is not available at the moment.</p>
      </div>
    );
  }
  const {
    kpis = {},
    recentActivity = {},
    insights = []
  } = data;

  const {
    totalProjects = 0,
    totalTasks = 0,
    completedTasks = 0,
    activeTasks = 0,
    overdueTasks = 0,
    totalBudget = 0,
    totalSpent = 0,
    budgetUtilization = 0
  } = kpis;

  const {
    tasks: recentTasks = [],
    expenses: recentExpenses = []
  } = recentActivity;

  // Mock data for charts since backend doesn't provide this yet
  const taskStatusDistribution = [
    { _id: 'Done', count: completedTasks },
    { _id: 'In Progress', count: activeTasks },
    { _id: 'Overdue', count: overdueTasks }
  ];

  const projectStatusDistribution = [
    { _id: 'Active', count: Math.floor(totalProjects * 0.7) },
    { _id: 'Completed', count: Math.floor(totalProjects * 0.2) },
    { _id: 'On Hold', count: Math.floor(totalProjects * 0.1) }
  ];

  // Calculate team members from projects (mock)
  const totalTeamMembers = Math.max(1, Math.floor(totalProjects * 3.5));

  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

  // Transform data for charts
  const taskStatusData = taskStatusDistribution.map(item => ({
    name: item._id || 'Unknown',
    value: item.count || 0
  }));

  const projectStatusData = projectStatusDistribution.map(item => ({
    name: item._id || 'Unknown',
    value: item.count || 0
  }));

  const kpiCards = [
    {
      title: 'Total Projects',
      value: totalProjects,
      icon: BuildingOfficeIcon,
      trend: 'up',
      trendValue: '+12%',
      color: 'bg-blue-500'
    },
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: ChartBarIcon,
      trend: 'up',
      trendValue: '+8%',
      color: 'bg-green-500'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrophyIcon,
      trend: 'up',
      trendValue: '+5%',
      color: 'bg-purple-500'
    },
    {
      title: 'Team Members',
      value: totalTeamMembers,
      icon: UserGroupIcon,
      trend: 'neutral',
      trendValue: '0%',
      color: 'bg-orange-500'
    },
    {
      title: 'Total Budget',
      value: formatCurrency ? formatCurrency(totalBudget) : `$${totalBudget}`,
      icon: CurrencyDollarIcon,
      trend: 'up',
      trendValue: '+15%',
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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpiCards.map((card, index) => {
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          {taskStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No task status data available
            </div>
          )}
        </div>

        {/* Project Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
          {projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No project status data available
            </div>
          )}
        </div>
      </div>      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {recentTasks.length > 0 || recentExpenses.length > 0 ? (
          <div className="space-y-3">
            {/* Recent Tasks */}
            {recentTasks.slice(0, 3).map((task, index) => (
              <div key={`task-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{task.title || 'Untitled Task'}</p>
                  <p className="text-xs text-gray-500">{task.projectId?.name || 'Unknown Project'}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.status === 'Done' ? 'bg-green-100 text-green-800' :
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status || 'Unknown'}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(task.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Recent Expenses */}
            {recentExpenses.slice(0, 2).map((expense, index) => (
              <div key={`expense-${index}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{expense.description || 'Expense'}</p>
                  <p className="text-xs text-gray-500">{expense.projectId?.name || 'Unknown Project'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency ? formatCurrency(expense.amount) : `$${expense.amount}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p>No recent activity</p>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white">
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="text-sm opacity-90">Overall Completion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalProjects}</div>
            <div className="text-sm opacity-90">Active Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalTeamMembers}</div>
            <div className="text-sm opacity-90">Team Members</div>
          </div>
        </div>
      </div>
    </div>
  );
}
