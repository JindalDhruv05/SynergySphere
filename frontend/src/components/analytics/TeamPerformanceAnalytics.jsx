import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  UserGroupIcon, 
  TrophyIcon, 
  ClockIcon,
  ChatBubbleOvalLeftIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6', '#EC4899'];

export default function TeamPerformanceAnalytics({ timeRange, setLoading }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('all');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading && setLoading(true);
      setError(null);
      const response = await api.get(`/analytics/team-performance?timeRange=${timeRange}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching team performance analytics:', error);
      setError('Failed to load team performance data');
    } finally {
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

  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  const formatHours = (value) => {
    return `${Math.round(value)}h`;
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCollaborationColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'average': return 'text-yellow-600 bg-yellow-50';
      case 'needs-improvement': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading team performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Performance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPercentage(data.summary?.averagePerformance || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckBadgeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{data.summary?.tasksCompleted || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChatBubbleOvalLeftIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Collaboration Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPercentage(data.summary?.collaborationScore || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatHours(data.summary?.averageResponseTime || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Selector */}
      {data.teams && data.teams.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTeam('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedTeam === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Teams
            </button>
            {data.teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedTeam === team.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.performanceTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} tickFormatter={formatPercentage} />
              <Tooltip formatter={(value) => formatPercentage(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="performance" 
                name="Team Performance"
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
              <Line 
                type="monotone" 
                dataKey="collaboration" 
                name="Collaboration"
                stroke="#6366F1" 
                strokeWidth={2}
                dot={{ fill: '#6366F1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance Radar */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Team Performance Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data.performanceRadar || []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar
                name="Performance"
                dataKey="score"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
              <Tooltip formatter={(value) => formatPercentage(value)} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Task Completion Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Completion by Priority */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Task Completion by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.taskCompletionByPriority || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" name="Completed" fill="#10B981" />
              <Bar dataKey="pending" name="Pending" fill="#F59E0B" />
              <Bar dataKey="overdue" name="Overdue" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Communication Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Communication Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.communicationActivity || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="messages" name="Messages" fill="#6366F1" />
              <Bar dataKey="comments" name="Comments" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Performance Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Individual Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On-time Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collaboration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(data.individualPerformance || []).map((member, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {member.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${member.performanceScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {formatPercentage(member.performanceScore)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.tasksCompleted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPercentage(member.onTimeDelivery)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCollaborationColor(member.collaborationLevel)}`}>
                      {member.collaborationLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatHours(member.avgResponseTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(member.performanceScore)}`}>
                      {member.performanceScore >= 90 ? 'Excellent' :
                       member.performanceScore >= 75 ? 'Good' :
                       member.performanceScore >= 60 ? 'Average' : 'Needs Improvement'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Collaboration Network */}
      {data.collaborationNetwork && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Team Collaboration Network</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.collaborationNetwork.map((connection, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {connection.from?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{connection.from}</span>
                  </div>
                  <div className="text-xs text-gray-500">→</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{connection.to}</span>
                    <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {connection.to?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  {connection.interactions} interactions
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full" 
                      style={{ width: `${Math.min(connection.strength * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance Insights</h3>
          <div className="space-y-3">
            {data.insights.map((insight, index) => (
              <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg">
                <div className="flex-shrink-0">
                  <TrophyIcon className="h-5 w-5 text-green-600 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{insight.message}</p>
                  {insight.recommendation && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      Recommendation: {insight.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
