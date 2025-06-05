import React from 'react';
import {
  TrophyIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function PersonalPerformance({ data, formatPercentage }) {
  if (!data) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Personal performance data is not available at the moment.</p>
      </div>
    );
  }

  const {
    tasksCompleted = [],
    tasksByPriority = [],
    tasksByStatus = [],
    avgCompletionTime = 0,
    overdueTasks = 0,
    totalActiveTasks = 0,
    timeRange = 30
  } = data;

  // Transform data for charts
  const taskStatusData = tasksByStatus.map(item => ({
    name: item._id || 'Unknown',
    value: item.count || 0
  }));

  const taskPriorityData = tasksByPriority.map(item => ({
    name: item._id || 'Unknown',
    value: item.count || 0
  }));

  const completionTrendData = tasksCompleted.map(item => ({
    date: item._id,
    completed: item.count || 0
  }));

  const totalTasks = taskStatusData.reduce((sum, item) => sum + item.value, 0);
  const completedCount = taskStatusData.find(item => item.name === 'Done')?.value || 0;
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const performanceCards = [
    {
      title: 'Tasks Completed',
      value: completedCount,
      icon: CheckCircleIcon,
      trend: 'up',
      trendValue: '+12%',
      color: 'bg-green-500'
    },
    {
      title: 'Active Tasks',
      value: totalActiveTasks,
      icon: ChartBarIcon,
      trend: 'neutral',
      trendValue: '0%',
      color: 'bg-blue-500'
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks,
      icon: ExclamationTriangleIcon,
      trend: overdueTasks > 0 ? 'down' : 'neutral',
      trendValue: overdueTasks > 0 ? `${overdueTasks} tasks` : 'None',
      color: 'bg-red-500'
    },
    {
      title: 'Avg. Completion',
      value: `${avgCompletionTime.toFixed(1)} days`,
      icon: ClockIcon,
      trend: 'up',
      trendValue: '-2 days',
      color: 'bg-purple-500'
    },
    {
      title: 'Completion Rate',
      value: formatPercentage ? formatPercentage(completionRate) : `${completionRate.toFixed(1)}%`,
      icon: TrophyIcon,
      trend: 'up',
      trendValue: '+5%',
      color: 'bg-orange-500'
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
      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {performanceCards.map((card, index) => {
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

        {/* Task Priority Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
          {taskPriorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskPriorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No priority data available
            </div>
          )}
        </div>
      </div>

      {/* Task Completion Trend */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Task Completion Trend (Last {timeRange} days)
        </h3>
        {completionTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={completionTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No completion trend data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-lg text-white">
        <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Productivity Score</div>
            <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
            <div className="text-xs opacity-90">Based on completion rate</div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Efficiency</div>
            <div className="text-2xl font-bold">{avgCompletionTime.toFixed(1)}</div>
            <div className="text-xs opacity-90">Avg days per task</div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Focus Areas</div>
            <div className="text-sm">
              {overdueTasks > 0 ? 'Reduce overdue tasks' : 'Maintain quality'}
            </div>
            <div className="text-xs opacity-90">Recommended action</div>
          </div>
        </div>
      </div>
    </div>
  );
}
