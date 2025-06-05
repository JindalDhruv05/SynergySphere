import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart
} from 'recharts';
import { 
  UserGroupIcon, 
  ClockIcon, 
  CpuChipIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6', '#EC4899'];

export default function ResourceUtilizationAnalytics({ timeRange, setLoading }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading && setLoading(true);
      setError(null);
      const response = await api.get(`/analytics/resource-utilization?timeRange=${timeRange}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching resource utilization analytics:', error);
      setError('Failed to load resource utilization data');
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

  const getUtilizationColor = (utilization) => {
    if (utilization >= 90) return 'text-red-600 bg-red-50';
    if (utilization >= 75) return 'text-yellow-600 bg-yellow-50';
    if (utilization >= 50) return 'text-green-600 bg-green-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'expert': return 'text-purple-600 bg-purple-50';
      case 'advanced': return 'text-blue-600 bg-blue-50';
      case 'intermediate': return 'text-green-600 bg-green-50';
      case 'beginner': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading resource utilization data...</p>
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
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-semibold text-gray-900">{data.summary?.totalMembers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Utilization</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPercentage(data.summary?.averageUtilization || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CpuChipIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatHours(data.summary?.totalHours || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overallocated</p>
              <p className="text-2xl font-semibold text-gray-900">{data.summary?.overallocated || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('individual')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedView === 'individual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setSelectedView('skills')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedView === 'skills'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Skills
          </button>
        </div>

        {selectedView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Utilization Distribution */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Utilization Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.utilizationDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(data.utilizationDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Workload Trends */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Workload Trends</h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.workloadTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={formatHours} />
                  <Tooltip formatter={(value) => formatHours(value)} />
                  <Area 
                    type="monotone" 
                    dataKey="totalHours" 
                    name="Total Hours"
                    stroke="#10B981" 
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedView === 'individual' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Individual Resource Utilization</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours/Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Projects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(data.individualUtilization || []).map((member, index) => (
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
                              className={`h-2 rounded-full ${
                                member.utilization >= 100 ? 'bg-red-600' :
                                member.utilization >= 75 ? 'bg-yellow-500' : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(member.utilization, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {formatPercentage(member.utilization)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatHours(member.hoursPerWeek)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.activeProjects}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.activeTasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUtilizationColor(member.utilization)}`}>
                          {member.utilization >= 100 ? 'Overloaded' :
                           member.utilization >= 75 ? 'High' :
                           member.utilization >= 50 ? 'Optimal' : 'Underutilized'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedView === 'skills' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Skills Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.skillsDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="beginner" name="Beginner" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="intermediate" name="Intermediate" stackId="a" fill="#10B981" />
                  <Bar dataKey="advanced" name="Advanced" stackId="a" fill="#6366F1" />
                  <Bar dataKey="expert" name="Expert" stackId="a" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Team Skills Matrix</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team Member
                      </th>
                      {(data.skillsMatrix?.skills || []).map((skill, index) => (
                        <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {skill}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(data.skillsMatrix?.members || []).map((member, index) => (
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
                            </div>
                          </div>
                        </td>
                        {member.skills.map((skill, skillIndex) => (
                          <td key={skillIndex} className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSkillLevelColor(skill.level)}`}>
                              {skill.level}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resource Allocation Timeline */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Resource Allocation Timeline</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.allocationTimeline || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatPercentage} />
            <Tooltip formatter={(value) => formatPercentage(value)} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="allocated" 
              name="Allocated"
              stroke="#10B981" 
              strokeWidth={2}
              dot={{ fill: '#10B981' }}
            />
            <Line 
              type="monotone" 
              dataKey="available" 
              name="Available"
              stroke="#6366F1" 
              strokeWidth={2}
              dot={{ fill: '#6366F1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Insights</h3>
          <div className="space-y-3">
            {data.insights.map((insight, index) => (
              <div key={index} className="flex items-start p-3 bg-purple-50 rounded-lg">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-purple-800">{insight.message}</p>
                  {insight.recommendation && (
                    <p className="text-sm text-purple-600 mt-1 font-medium">
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
