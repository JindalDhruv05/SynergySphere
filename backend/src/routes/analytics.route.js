import express from 'express';
import {
  getProductivityAnalytics,
  getProjectPerformanceAnalytics,
  getResourceUtilizationAnalytics,
  getTeamPerformanceAnalytics,
  getDashboardAnalytics
} from '../controllers/analytics.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All analytics routes require authentication
router.use(verifyToken);

// Get productivity analytics
router.get('/productivity', getProductivityAnalytics);

// Get project performance analytics
router.get('/project-performance', getProjectPerformanceAnalytics);

// Get resource utilization analytics
router.get('/resource-utilization', getResourceUtilizationAnalytics);

// Get team performance analytics (for admins/creators)
router.get('/team-performance', getTeamPerformanceAnalytics);

// Get dashboard analytics overview
router.get('/dashboard', getDashboardAnalytics);

export default router;
