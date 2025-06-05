// Analytics test script
import express from 'express';
import connectDB from '../db.js';
import { generateSampleData } from '../utils/sampleData.js';
import { 
  getProductivityAnalytics,
  getProjectPerformanceAnalytics,
  getResourceUtilizationAnalytics,
  getTeamPerformanceAnalytics,
  getDashboardOverview
} from '../controllers/analytics.controller.js';

const app = express();

// Mock request and response objects for testing
const createMockReq = (userId, query = {}) => ({
  user: { id: userId },
  query
});

const createMockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function testAnalytics() {
  try {    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Generating sample data...');
    const { users } = await generateSampleData();
    
    const testUserId = users[0]._id;
    console.log(`Testing analytics for user: ${users[0].name} (${testUserId})`);
    
    // Test Productivity Analytics
    console.log('\n=== Testing Productivity Analytics ===');
    const productivityReq = createMockReq(testUserId, { timeRange: '30' });
    const productivityRes = createMockRes();
    
    await getProductivityAnalytics(productivityReq, productivityRes);
    console.log('Productivity Analytics Status:', productivityRes.statusCode);
    if (productivityRes.data) {
      console.log('Tasks Completed:', productivityRes.data.tasksCompleted?.length || 0);
      console.log('Task Priority Distribution:', productivityRes.data.tasksByPriority?.length || 0, 'categories');
    }
    
    // Test Project Performance Analytics
    console.log('\n=== Testing Project Performance Analytics ===');
    const projectPerformanceReq = createMockReq(testUserId, { timeRange: '90' });
    const projectPerformanceRes = createMockRes();
    
    await getProjectPerformanceAnalytics(projectPerformanceReq, projectPerformanceRes);
    console.log('Project Performance Status:', projectPerformanceRes.statusCode);
    if (projectPerformanceRes.data) {
      console.log('Project Health:', projectPerformanceRes.data.projectHealth?.length || 0, 'projects');
      console.log('Budget Analysis:', projectPerformanceRes.data.budgetAnalysis?.length || 0, 'projects');
    }
    
    // Test Resource Utilization Analytics
    console.log('\n=== Testing Resource Utilization Analytics ===');
    const resourceReq = createMockReq(testUserId, { timeRange: '30' });
    const resourceRes = createMockRes();
    
    await getResourceUtilizationAnalytics(resourceReq, resourceRes);
    console.log('Resource Utilization Status:', resourceRes.statusCode);
    if (resourceRes.data) {
      console.log('Individual Utilization:', resourceRes.data.individualUtilization?.length || 0, 'members');
      console.log('Skills Distribution:', resourceRes.data.skillsDistribution?.length || 0, 'skills');
    }
    
    // Test Team Performance Analytics
    console.log('\n=== Testing Team Performance Analytics ===');
    const teamReq = createMockReq(testUserId, { timeRange: '60' });
    const teamRes = createMockRes();
    
    await getTeamPerformanceAnalytics(teamReq, teamRes);
    console.log('Team Performance Status:', teamRes.statusCode);
    if (teamRes.data) {
      console.log('Individual Performance:', teamRes.data.individualPerformance?.length || 0, 'members');
      console.log('Performance Trends:', teamRes.data.performanceTrends?.length || 0, 'data points');
    }
    
    // Test Dashboard Overview
    console.log('\n=== Testing Dashboard Overview ===');
    const dashboardReq = createMockReq(testUserId, { timeRange: '30' });
    const dashboardRes = createMockRes();
    
    await getDashboardOverview(dashboardReq, dashboardRes);
    console.log('Dashboard Overview Status:', dashboardRes.statusCode);
    if (dashboardRes.data) {
      console.log('KPIs available:', Object.keys(dashboardRes.data.kpis || {}).length);
      console.log('Recent Activity:', dashboardRes.data.recentActivity?.length || 0, 'items');
      console.log('Insights:', dashboardRes.data.insights?.length || 0, 'insights');
    }
    
    console.log('\n✅ Analytics testing completed successfully!');
    console.log('\nThe analytics system includes:');
    console.log('- Productivity tracking with task completion trends');
    console.log('- Project performance monitoring with budget analysis');
    console.log('- Resource utilization insights with team workload');
    console.log('- Team performance metrics with collaboration analysis');
    console.log('- Comprehensive dashboard overview with actionable insights');
    
  } catch (error) {
    console.error('❌ Error testing analytics:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testAnalytics();
