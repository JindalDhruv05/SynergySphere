import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function ProjectBudget({ projectId, project, onUpdateProject }) {
  const [budgetOverview, setBudgetOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    totalBudget: 0,
    currency: 'USD'
  });

  useEffect(() => {
    fetchBudgetOverview();
    if (project?.budget) {
      setBudgetForm({
        totalBudget: project.budget.totalBudget || 0,
        currency: project.budget.currency || 'USD'
      });
    }
  }, [projectId, project]);

  const fetchBudgetOverview = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/expenses/project/${projectId}/budget-overview`);
      setBudgetOverview(response.data);
    } catch (error) {
      console.error('Error fetching budget overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/projects/${projectId}/budget`, {
        totalBudget: parseFloat(budgetForm.totalBudget),
        currency: budgetForm.currency
      });
      
      onUpdateProject(response.data);
      setShowEditBudget(false);
      fetchBudgetOverview();
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getBudgetStatus = () => {
    if (!budgetOverview || budgetOverview.budget.totalBudget === 0) return 'not-set';
    if (budgetOverview.budgetUtilization >= 100) return 'exceeded';
    if (budgetOverview.budgetUtilization >= 80) return 'warning';
    return 'good';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'good': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const budgetStatus = getBudgetStatus();

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Budget Overview</h3>
          </div>
          <button
            onClick={() => setShowEditBudget(!showEditBudget)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit Budget
          </button>
        </div>
      </div>

      {/* Edit Budget Form */}
      {showEditBudget && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleUpdateBudget} className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Budget
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budgetForm.totalBudget}
                onChange={(e) => setBudgetForm({ ...budgetForm, totalBudget: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={budgetForm.currency}
                onChange={(e) => setBudgetForm({ ...budgetForm, currency: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowEditBudget(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Stats */}
      <div className="p-6">
        {budgetOverview?.budget.totalBudget > 0 ? (
          <>
            {/* Budget Status Alert */}
            {budgetStatus !== 'good' && budgetStatus !== 'not-set' && (
              <div className={`rounded-md p-4 mb-6 ${getStatusColor(budgetStatus)}`}>
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium">
                      {budgetStatus === 'exceeded' ? 'Budget Exceeded' : 'Budget Warning'}
                    </h4>
                    <p className="text-sm mt-1">
                      {budgetStatus === 'exceeded' 
                        ? 'Your project has exceeded its allocated budget.'
                        : 'Your project is approaching its budget limit.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
                <span className="text-sm text-gray-500">{budgetOverview.budgetUtilization}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    budgetOverview.budgetUtilization >= 100
                      ? 'bg-red-500'
                      : budgetOverview.budgetUtilization >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetOverview.budgetUtilization, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Budget Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(budgetOverview.budget.totalBudget, budgetOverview.budget.currency)}
                </p>
                <p className="text-sm text-gray-500">Total Budget</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-blue-600">
                  {formatCurrency(budgetOverview.approvedExpenses, budgetOverview.budget.currency)}
                </p>
                <p className="text-sm text-gray-500">Approved Expenses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-yellow-600">
                  {formatCurrency(budgetOverview.pendingExpenses, budgetOverview.budget.currency)}
                </p>
                <p className="text-sm text-gray-500">Pending Expenses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">
                  {formatCurrency(budgetOverview.remainingBudget, budgetOverview.budget.currency)}
                </p>
                <p className="text-sm text-gray-500">Remaining Budget</p>
              </div>
            </div>

            {/* Category Breakdown */}
            {Object.keys(budgetOverview.categoryBreakdown).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Expenses by Category</h4>
                <div className="space-y-2">
                  {Object.entries(budgetOverview.categoryBreakdown).map(([category, data]) => (
                    <div key={category} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">{category}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(data.amount, budgetOverview.budget.currency)}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">({data.count} items)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">No budget set</h4>
            <p className="mt-1 text-sm text-gray-500">
              Set a budget to track your project expenses and monitor spending.
            </p>
            <button
              onClick={() => setShowEditBudget(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Set Budget
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
