import React from 'react';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ShoppingCartIcon
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
  Bar,
  Area,
  AreaChart
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function BudgetAnalytics({ data, formatCurrency }) {
  if (!data) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Budget analytics data is not available at the moment.</p>
      </div>
    );
  }
  const {
    summary = {},
    budgetAnalysis = [],
    expenseTrends = [],
    expenseByCategory = [],
    resourceAllocation = [],
    timeRange = 30
  } = data;

  const {
    totalMembers = 0,
    totalHours = 0,
    averageUtilization = 0,
    overallocated = 0
  } = summary;

  // Transform resource utilization data to budget analytics format
  const totalBudget = budgetAnalysis.reduce((sum, item) => sum + (item.budgeted || 0), 0);
  const totalSpent = budgetAnalysis.reduce((sum, item) => sum + (item.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const averageMonthlySpend = totalSpent / Math.max(1, Math.ceil(timeRange / 30));
  const overBudgetProjects = budgetAnalysis.filter(item => item.spent > item.budgeted).length;

  // Transform data for frontend
  const expensesByCategory = expenseByCategory;
  const expensesTrend = expenseTrends;
  const projectBudgets = budgetAnalysis.map(item => ({
    projectName: item.projectName || `Project ${item.projectId}`,
    totalBudget: item.budgeted || 0,
    totalSpent: item.spent || 0,
    budgetUtilization: item.budgeted > 0 ? (item.spent / item.budgeted) * 100 : 0
  }));
  const upcomingExpenses = []; // Not provided by backend

  // Transform data for charts
  const expensesCategoryData = expensesByCategory.map(item => ({
    name: item._id || 'Unknown',
    value: item.totalAmount || 0,
    count: item.count || 0
  }));

  const expensesTrendData = expensesTrend.map(item => ({
    date: item._id,
    amount: item.totalAmount || 0,
    count: item.count || 0
  }));

  const projectBudgetData = projectBudgets.map(project => ({
    name: project.projectName?.substring(0, 15) + (project.projectName?.length > 15 ? '...' : '') || 'Unnamed',
    budget: project.totalBudget || 0,
    spent: project.totalSpent || 0,
    remaining: (project.totalBudget || 0) - (project.totalSpent || 0),
    utilization: project.budgetUtilization || 0
  }));

  const budgetCards = [
    {
      title: 'Total Budget',
      value: formatCurrency ? formatCurrency(totalBudget) : `$${totalBudget.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      trend: 'up',
      trendValue: '+15%',
      color: 'bg-blue-500'
    },
    {
      title: 'Total Spent',
      value: formatCurrency ? formatCurrency(totalSpent) : `$${totalSpent.toLocaleString()}`,
      icon: ShoppingCartIcon,
      trend: 'up',
      trendValue: `${budgetUtilization.toFixed(1)}%`,
      color: 'bg-red-500'
    },
    {
      title: 'Remaining Budget',
      value: formatCurrency ? formatCurrency(totalRemaining) : `$${totalRemaining.toLocaleString()}`,
      icon: CheckCircleIcon,
      trend: totalRemaining > 0 ? 'up' : 'down',
      trendValue: `${((totalRemaining / totalBudget) * 100).toFixed(1)}%`,
      color: 'bg-green-500'
    },
    {
      title: 'Budget Utilization',
      value: `${budgetUtilization.toFixed(1)}%`,
      icon: ChartBarIcon,
      trend: budgetUtilization > 80 ? 'down' : 'up',
      trendValue: budgetUtilization > 80 ? 'Over target' : 'On track',
      color: budgetUtilization > 80 ? 'bg-orange-500' : 'bg-purple-500'
    },
    {
      title: 'Over Budget Projects',
      value: overBudgetProjects,
      icon: ExclamationTriangleIcon,
      trend: overBudgetProjects > 0 ? 'down' : 'neutral',
      trendValue: overBudgetProjects > 0 ? 'Need attention' : 'All good',
      color: overBudgetProjects > 0 ? 'bg-red-600' : 'bg-green-600'
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
      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {budgetCards.map((card, index) => {
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
        {/* Expenses by Category */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          {expensesCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesCategoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {expensesCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency ? formatCurrency(value) : `$${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No expense category data available
            </div>
          )}
        </div>

        {/* Project Budget Utilization */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Budget Utilization</h3>
          {projectBudgetData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectBudgetData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency ? formatCurrency(value) : `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="budget" fill="#E5E7EB" name="Total Budget" />
                <Bar dataKey="spent" fill="#EF4444" name="Amount Spent" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No project budget data available
            </div>
          )}
        </div>
      </div>

      {/* Expense Trend */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Expense Trend (Last {timeRange} days)
        </h3>
        {expensesTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={expensesTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency ? formatCurrency(value) : `$${value.toLocaleString()}`} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Daily Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No expense trend data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Budget Overview Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Budget Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Budget Details</h3>
          {projectBudgetData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectBudgetData.slice(0, 5).map((project, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency ? formatCurrency(project.budget) : `$${project.budget.toLocaleString()}`}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency ? formatCurrency(project.spent) : `$${project.spent.toLocaleString()}`}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          project.utilization > 90 
                            ? 'bg-red-100 text-red-800'
                            : project.utilization > 75 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {project.utilization > 90 ? 'Over Budget' : 
                           project.utilization > 75 ? 'At Risk' : 'On Track'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CurrencyDollarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No project budget details available</p>
            </div>
          )}
        </div>

        {/* Upcoming Expenses */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Expenses</h3>
          {upcomingExpenses && upcomingExpenses.length > 0 ? (
            <div className="space-y-3">
              {upcomingExpenses.slice(0, 5).map((expense, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {expense.description || 'Upcoming Expense'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {expense.dueDate || 'No due date'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency ? formatCurrency(expense.amount || 0) : `$${(expense.amount || 0).toLocaleString()}`}
                    </p>
                    <p className="text-xs text-gray-500">{expense.category || 'General'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No upcoming expenses</p>
            </div>
          )}
        </div>
      </div>

      {/* Budget Health Summary */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg text-white">
        <h3 className="text-lg font-semibold mb-4">Budget Health Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Overall Health</div>
            <div className="text-2xl font-bold">
              {budgetUtilization < 75 ? 'Healthy' : budgetUtilization < 90 ? 'Caution' : 'Critical'}
            </div>
            <div className="text-xs opacity-90">Budget status</div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Utilization</div>
            <div className="text-2xl font-bold">{budgetUtilization.toFixed(0)}%</div>
            <div className="text-xs opacity-90">Of total budget</div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Monthly Avg</div>
            <div className="text-2xl font-bold">
              {formatCurrency ? formatCurrency(averageMonthlySpend) : `$${averageMonthlySpend.toLocaleString()}`}
            </div>
            <div className="text-xs opacity-90">Average spend</div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-1">Remaining</div>
            <div className="text-2xl font-bold">
              {formatCurrency ? formatCurrency(totalRemaining) : `$${totalRemaining.toLocaleString()}`}
            </div>
            <div className="text-xs opacity-90">Available budget</div>
          </div>
        </div>
      </div>
    </div>
  );
}
