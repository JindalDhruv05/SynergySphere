import { useState, useEffect } from 'react';
import { CurrencyDollarIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function TaskExpenses({ taskId, projectId }) {
  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'Other',
    description: ''
  });

  const expenseCategories = [
    'Software/Tools',
    'Travel',
    'Materials',
    'Services',
    'Equipment',
    'Marketing',
    'Training',
    'Other'
  ];

  useEffect(() => {
    fetchTaskExpenses();
  }, [taskId]);

  const fetchTaskExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/expenses/task/${taskId}`);
      setExpenses(response.data.expenses);
      setTotalAmount(response.data.totalAmount);
    } catch (error) {
      console.error('Error fetching task expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const expenseData = {
        ...expenseForm,
        projectId,
        taskId,
        amount: parseFloat(expenseForm.amount)
      };
      
      await api.post('/expenses', expenseData);
      setShowAddExpense(false);
      setExpenseForm({
        title: '',
        amount: '',
        category: 'Other',
        description: ''
      });
      fetchTaskExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 text-blue-500 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Task Expenses</h4>
          {totalAmount > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              Total: {formatCurrency(totalAmount)}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddExpense(!showAddExpense)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Expense
        </button>
      </div>

      {/* Add Expense Form */}
      {showAddExpense && (
        <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
          <form onSubmit={handleAddExpense} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Expense title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount*</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {expenseCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Optional description"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddExpense(false)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses List */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No expenses recorded for this task.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h5 className="text-sm font-medium text-gray-900">{expense.title}</h5>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {expense.category}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    expense.status === 'Approved' || expense.status === 'Paid'
                      ? 'bg-green-100 text-green-800'
                      : expense.status === 'Rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {expense.status}
                  </span>
                </div>
                {expense.description && (
                  <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Added by {expense.createdBy.name} on {new Date(expense.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(expense.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
