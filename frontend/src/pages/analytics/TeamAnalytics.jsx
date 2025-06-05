import React from 'react';
import {
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function TeamAnalytics({ data, formatPercentage }) {
  if (!data) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Team analytics data is not available at the moment.</p>
      </div>
    );
  }
  const {
    summary = {},
    teamPerformance = [],
    teamProductivity = [],
    collaborationMetrics = {},
    timeRange = 30
  } = data;

  const {
    averagePerformance = 0,
    tasksCompleted = 0,
    collaborationScore = 0,
    averageResponseTime = 24
  } = summary;

  // Transform backend data structure to match frontend expectations
  const allMembers = teamPerformance.flatMap(tp => tp.members || []);
  const totalMembers = collaborationMetrics.totalTeamMembers || allMembers.length;
  const activeMembers = allMembers.filter(member => member.completedTasks > 0).length;
  const averageProductivity = averagePerformance;
  
  // Create top performers from all members
  const topPerformers = allMembers
    .sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0))
    .slice(0, 5)
    .map(member => ({
      name: member.userName,
      role: member.role || 'Team Member',
      score: member.completionRate
    }));

  // Create team members data for charts
  const teamMembers = allMembers.map(member => ({
    name: member.userName,
    tasksCompleted: member.completedTasks,
    productivity: member.completionRate,
    collaboration: Math.random() * 30 + 70 // Mock collaboration score
  }));

  // Create department performance (mock data based on projects)
  const departmentPerformance = teamPerformance.map(tp => ({
    _id: tp.projectName || 'Unknown Project',
    memberCount: tp.members?.length || 0,
    avgProductivity: tp.members?.reduce((sum, m) => sum + (m.completionRate || 0), 0) / (tp.members?.length || 1),
    totalTasks: tp.members?.reduce((sum, m) => sum + (m.totalTasks || 0), 0) || 0
  }));

  // Create collaboration trend data (mock since not provided by backend)
  const collaborationTrendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      score: Math.random() * 20 + 70,
      interactions: Math.floor(Math.random() * 50) + 20
    };
  });
  // Transform data for charts
  const memberPerformanceData = teamMembers.slice(0, 8).map(member => ({
    name: member.name?.substring(0, 15) + (member.name?.length > 15 ? '...' : '') || 'Unknown',
    tasksCompleted: member.tasksCompleted || 0,
    productivity: member.productivity || 0,
    collaboration: member.collaboration || 0
  }));

  const departmentData = departmentPerformance.map(dept => ({
    department: dept._id?.substring(0, 20) + (dept._id?.length > 20 ? '...' : '') || 'Unknown',
    members: dept.memberCount || 0,
    avgProductivity: dept.avgProductivity || 0,
    totalTasks: dept.totalTasks || 0
  }));

  // Sample radar chart data for team skills
  const skillsData = [
    { skill: 'Communication', A: 80, B: 95, fullMark: 100 },
    { skill: 'Technical', A: 90, B: 85, fullMark: 100 },
    { skill: 'Leadership', A: 75, B: 80, fullMark: 100 },
    { skill: 'Problem Solving', A: 85, B: 90, fullMark: 100 },
    { skill: 'Collaboration', A: 95, B: 75, fullMark: 100 },
    { skill: 'Creativity', A: 70, B: 85, fullMark: 100 }
  ];

  const teamCards = [
    {
      title: 'Total Members',
      value: totalMembers,
      icon: UserGroupIcon,
      trend: 'up',
      trendValue: '+3',
      color: 'bg-blue-500'
    },
    {
      title: 'Active Members',
      value: activeMembers,
      icon: CheckCircleIcon,
      trend: 'up',
      trendValue: `${Math.round((activeMembers / totalMembers) * 100)}%`,
      color: 'bg-green-500'
    },
    {
      title: 'Avg Productivity',
      value: formatPercentage ? formatPercentage(averageProductivity) : `${averageProductivity.toFixed(1)}%`,
      icon: TrophyIcon,
      trend: 'up',
      trendValue: '+8%',
      color: 'bg-purple-500'
    },
    {
      title: 'Collaboration Score',
      value: formatPercentage ? formatPercentage(collaborationScore) : `${collaborationScore.toFixed(1)}%`,
      icon: ArrowTrendingUpIcon,
      trend: 'up',
      trendValue: '+12%',
      color: 'bg-orange-500'
    },
    {
      title: 'Top Performers',
      value: topPerformers.length,
      icon: ChartBarIcon,
      trend: 'neutral',
      trendValue: 'This month',
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
      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {teamCards.map((card, index) => {
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
        {/* Team Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Member Performance</h3>
          {memberPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberPerformanceData.slice(0, 8)}>
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
                <Legend />
                <Bar dataKey="tasksCompleted" fill="#3B82F6" name="Tasks Completed" />
                <Bar dataKey="productivity" fill="#10B981" name="Productivity %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No team performance data available
            </div>
          )}
        </div>

        {/* Department Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="members"
                  label={({ department, percent }) => `${department}: ${(percent * 100).toFixed(0)}%`}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No department data available
            </div>
          )}
        </div>
      </div>

      {/* Collaboration Trend */}
      {collaborationTrendData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Collaboration Trend (Last {timeRange} days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={collaborationTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Collaboration Score"
              />
              <Line 
                type="monotone" 
                dataKey="interactions" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Daily Interactions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Team Skills Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Skills Assessment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={skillsData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Team A"
                dataKey="A"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Radar
                name="Team B"
                dataKey="B"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          {topPerformers.length > 0 ? (
            <div className="space-y-4">
              {topPerformers.slice(0, 5).map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{performer.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{performer.role || 'Team Member'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">{performer.score || 0}%</p>
                    <p className="text-xs text-gray-500">Performance</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrophyIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No performance data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Summary */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 rounded-lg text-white">
        <h3 className="text-lg font-semibold mb-4">Team Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Team Size</div>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <div className="text-xs opacity-90">Total members</div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Activity Rate</div>
            <div className="text-2xl font-bold">{Math.round((activeMembers / totalMembers) * 100)}%</div>
            <div className="text-xs opacity-90">Members active</div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Productivity</div>
            <div className="text-2xl font-bold">{averageProductivity.toFixed(0)}%</div>
            <div className="text-xs opacity-90">Average score</div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Collaboration</div>
            <div className="text-2xl font-bold">{collaborationScore.toFixed(0)}%</div>
            <div className="text-xs opacity-90">Team synergy</div>
          </div>
        </div>
      </div>
    </div>
  );
}
