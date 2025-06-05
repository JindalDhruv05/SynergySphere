import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon
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
import api from '../../services/api';

export default function ProductivityAnalytics({ timeRange, setLoading }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/analytics/productivity?timeRange=${timeRange}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching productivity analytics:', error);
      setError('Failed to load productivity data');
    } finally {
      setLoading(false);
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
  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading productivity data...</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const completionTrendData = data.tasksCompleted.map(item => ({
    date: new Date(item._id).toLocaleDateString(),
    tasks: item.count
  }));

  const priorityData = data.tasksByPriority.map(item => ({
    name: item._id,
    value: item.count
  }));

  const statusData = data.tasksByStatus.map(item => ({
    name: item._id,
    value: item.count
  }));

  const COLORS = {
    'High': '#ef4444',
    'Medium': '#f59e0b',
    'Low': '#10b981',
    'Done': '#10b981',
    'In Progress': '#3b82f6',
    'To-Do': '#6b7280'
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-50">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalActiveTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-green-50">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Completion Time</p>
              <p className="text-2xl font-bold text-gray-900">{data.avgCompletionTime} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-red-50">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{data.overdueTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-purple-50">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.totalActiveTasks > 0 ? 
                  Math.round((statusData.find(s => s.name === 'Done')?.value || 0) / data.totalActiveTasks * 100) : 0
                }%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Completion Trend */}
      {completionTrendData.length > 0 && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completionTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Tasks Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Priority and Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Priority */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Status */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {data.avgCompletionTime <= 7 && (
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Fast task completion time ({data.avgCompletionTime} days average)
                </li>
              )}
              {data.overdueTasks === 0 && (
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  No overdue tasks - excellent time management
                </li>
              )}
              {statusData.find(s => s.name === 'Done')?.value > statusData.find(s => s.name === 'To-Do')?.value && (
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  More completed tasks than pending - good progress
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Areas for Improvement</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {data.overdueTasks > 0 && (
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">!</span>
                  {data.overdueTasks} overdue task{data.overdueTasks > 1 ? 's' : ''} need attention
                </li>
              )}
              {data.avgCompletionTime > 14 && (
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">!</span>
                  Consider breaking down tasks - average completion time is {data.avgCompletionTime} days
                </li>
              )}
              {priorityData.find(p => p.name === 'High')?.value > priorityData.find(p => p.name === 'Low')?.value * 2 && (
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">!</span>
                  High proportion of high-priority tasks - consider workload distribution
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
