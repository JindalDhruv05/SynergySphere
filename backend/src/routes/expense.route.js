import express from 'express';
import {
  getProjectExpenses,
  getTaskExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getProjectBudgetOverview
} from '../controllers/expense.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Project expense routes
router.get('/project/:projectId', getProjectExpenses);
router.get('/project/:projectId/budget-overview', getProjectBudgetOverview);

// Task expense routes
router.get('/task/:taskId', getTaskExpenses);

// CRUD operations
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

// Approval routes
router.patch('/:id/approve', approveExpense);
router.patch('/:id/reject', rejectExpense);

export default router;
