import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function ProjectTasksBudget({ projectId }) {
  const [tasksBudget, setTasksBudget] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasksBudget();
  }, [projectId]);

  const fetchTasksBudget = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/projects/${projectId}/tasks-budget`);
      setTasksBudget(response.data);
    } catch (error) {
      console.error('Error fetching tasks budget:', error);
      setError('Failed to load task budgets');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getUtilizationColor = (utilization) => {
    if (utilization > 100) return 'text-red-600 bg-red-50';
    if (utilization > 80) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in progress':
        return 'text-blue-600 bg-blue-100';
      case 'todo':
        return 'text-gray-600 bg-gray-100';
      case 'blocked':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchTasksBudget}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tasksBudget.length === 0) {
    return (
      <div className="text-center py-8">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No tasks with budgets found for this project.</p>
      </div>
    );
  }

  // Calculate project-level summary
  const totalProjectBudget = tasksBudget.reduce((sum, task) => sum + task.budget.totalBudget, 0);
  const totalProjectExpenses = tasksBudget.reduce((sum, task) => sum + task.approvedExpenses, 0);
  const avgUtilization = tasksBudget.length > 0 
    ? tasksBudget.reduce((sum, task) => sum + task.budgetUtilization, 0) / tasksBudget.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Task Budgets</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalProjectBudget, tasksBudget[0]?.budget.currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalProjectExpenses, tasksBudget[0]?.budget.currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <ExclamationTriangleIcon className={`h-8 w-8 ${getUtilizationColor(avgUtilization).split(' ')[0]}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Utilization</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgUtilization.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Budget Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasksBudget.map((task) => (
          <div key={task.taskId} className="bg-white rounded-lg shadow border overflow-hidden">
            {/* Task Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {task.taskName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.taskStatus)}`}>
                      {task.taskStatus}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.taskPriority)}`}>
                      {task.taskPriority} Priority
                    </span>
                  </div>
                </div>
                {(task.alerts.overBudget || task.alerts.nearBudgetLimit) && (
                  <ExclamationTriangleIcon className={`h-6 w-6 ${task.alerts.overBudget ? 'text-red-500' : 'text-yellow-500'}`} />
                )}
              </div>
            </div>

            {/* Budget Overview */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(task.budget.totalBudget, task.budget.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Spent</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(task.approvedExpenses, task.budget.currency)}
                  </p>
                </div>
              </div>

              {/* Budget Utilization Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Budget Utilization</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${getUtilizationColor(task.budgetUtilization)}`}>
                    {task.budgetUtilization}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      task.budgetUtilization > 100 
                        ? 'bg-red-500' 
                        : task.budgetUtilization > 80 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(task.budgetUtilization, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Remaining Budget */}
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Remaining</span>
                  <span className={`text-sm font-medium ${task.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(task.remainingBudget, task.budget.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Expenses</span>
                  <span className="text-sm font-medium text-gray-700">
                    {formatCurrency(task.totalExpenses, task.budget.currency)}
                  </span>
                </div>
              </div>

              {/* Expense Breakdown by Status */}
              {Object.keys(task.expenseBreakdown.byStatus).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Expense Status</p>
                  <div className="space-y-1">
                    {Object.entries(task.expenseBreakdown.byStatus).map(([status, data]) => (
                      <div key={status} className="flex justify-between text-xs">
                        <span className="text-gray-500 capitalize">{status}</span>
                        <span className="text-gray-700">
                          {formatCurrency(data.amount, task.budget.currency)} ({data.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
