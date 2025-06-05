import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import ProjectMember from '../models/projectMember.model.js';
import TaskMember from '../models/taskMember.model.js';
import Expense from '../models/expense.model.js';
import mongoose from 'mongoose';

// Get overall productivity analytics for the current user
export const getProductivityAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get user's projects
    const userProjects = await ProjectMember.find({ userId }).select('projectId');
    const projectIds = userProjects.map(pm => pm.projectId);

    // Get user's tasks
    const userTasks = await TaskMember.find({ userId }).select('taskId');
    const taskIds = userTasks.map(tm => tm.taskId);

    // Tasks completed over time
    const tasksCompleted = await Task.aggregate([
      {
        $match: {
          _id: { $in: taskIds },
          status: 'Done',
          updatedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Tasks by priority distribution
    const tasksByPriority = await Task.aggregate([
      {
        $match: {
          _id: { $in: taskIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);

    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      {
        $match: {
          _id: { $in: taskIds }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Average task completion time
    const completedTasks = await Task.find({
      _id: { $in: taskIds },
      status: 'Done',
      updatedAt: { $gte: startDate }
    });

    let avgCompletionTime = 0;
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        const completionTime = task.updatedAt - task.createdAt;
        return sum + completionTime;
      }, 0);
      avgCompletionTime = totalTime / completedTasks.length / (1000 * 60 * 60 * 24); // days
    }

    // Overdue tasks
    const overdueTasks = await Task.find({
      _id: { $in: taskIds },
      dueDate: { $lt: new Date() },
      status: { $ne: 'Done' }
    }).countDocuments();    // Active tasks (not completed)
    const activeTasks = await Task.find({
      _id: { $in: taskIds },
      status: { $ne: 'Done' }
    }).countDocuments();

    res.status(200).json({
      timeRange: parseInt(timeRange),
      tasksCompleted,
      tasksByPriority,
      tasksByStatus,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      overdueTasks,
      totalActiveTasks: activeTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching productivity analytics', error: error.message });
  }
};

// Get project performance analytics
export const getProjectPerformanceAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get user's projects
    const userProjects = await ProjectMember.find({ userId }).populate('projectId');
    const projectIds = userProjects.map(pm => pm.projectId._id);

    // Project completion rates
    const projectPerformance = await Promise.all(
      userProjects.map(async (pm) => {
        const project = pm.projectId;
        
        const totalTasks = await Task.countDocuments({ projectId: project._id });
        const completedTasks = await Task.countDocuments({ 
          projectId: project._id, 
          status: 'Done' 
        });
        const inProgressTasks = await Task.countDocuments({ 
          projectId: project._id, 
          status: 'In Progress' 
        });

        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Budget utilization
        const budgetUtilization = await project.getBudgetUtilization();
        
        // Recent activity
        const recentTasks = await Task.countDocuments({
          projectId: project._id,
          updatedAt: { $gte: startDate }
        });

        return {
          projectId: project._id,
          projectName: project.name,
          totalTasks,
          completedTasks,
          inProgressTasks,
          completionRate: Math.round(completionRate * 10) / 10,
          budgetUtilization: Math.round(budgetUtilization * 10) / 10,
          totalBudget: project.budget?.totalBudget || 0,
          currency: project.budget?.currency || 'USD',
          recentActivity: recentTasks,
          createdAt: project.createdAt
        };
      })
    );

    // Project creation trend
    const projectCreationTrend = await Project.aggregate([
      {
        $match: {
          _id: { $in: projectIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }    ]);

    // Calculate summary statistics
    const activeProjects = projectPerformance.filter(p => p.completionRate < 100).length;
    const completedProjects = projectPerformance.filter(p => p.completionRate === 100).length;
    const averageProgress = projectPerformance.length > 0 ? 
      projectPerformance.reduce((sum, p) => sum + p.completionRate, 0) / projectPerformance.length : 0;
    const atRiskProjects = projectPerformance.filter(p => p.budgetUtilization > 80 && p.completionRate < 80).length;

    res.status(200).json({
      timeRange: parseInt(timeRange),
      summary: {
        activeProjects,
        completedProjects,
        averageProgress: Math.round(averageProgress * 10) / 10,
        atRiskProjects
      },
      projectPerformance,
      projectCreationTrend,
      totalProjects: projectIds.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project performance analytics', error: error.message });
  }
};

// Get resource utilization analytics
export const getResourceUtilizationAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get user's projects and tasks
    const userProjects = await ProjectMember.find({ userId }).select('projectId');
    const projectIds = userProjects.map(pm => pm.projectId);

    const userTasks = await TaskMember.find({ userId }).select('taskId');
    const taskIds = userTasks.map(tm => tm.taskId);

    // Budget vs Actual spending
    const budgetAnalysis = await Promise.all(
      projectIds.map(async (projectId) => {
        const project = await Project.findById(projectId);
        const totalExpenses = await project.getTotalExpenses();
        
        return {
          projectId,
          budgeted: project.budget?.totalBudget || 0,
          spent: totalExpenses,
          currency: project.budget?.currency || 'USD'
        };
      })
    );

    // Expense trends
    const expenseTrends = await Expense.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Expense by category
    const expenseByCategory = await Expense.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Resource allocation by project
    const resourceAllocation = await Promise.all(
      projectIds.map(async (projectId) => {
        const project = await Project.findById(projectId);
        const memberCount = await ProjectMember.countDocuments({ projectId });
        const taskCount = await Task.countDocuments({ projectId });
        const totalExpenses = await project.getTotalExpenses();

        return {
          projectId,
          projectName: project.name,
          memberCount,
          taskCount,
          totalExpenses,
          budgetUtilization: await project.getBudgetUtilization()
        };
      })
    );

    // Time utilization patterns (based on task updates)
    const timeUtilization = await Task.aggregate([
      {
        $match: {
          _id: { $in: taskIds },
          updatedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: "$updatedAt" },
            hour: { $hour: "$updatedAt" }
          },
          activityCount: { $sum: 1 }
        }
      },      { $sort: { "_id.dayOfWeek": 1, "_id.hour": 1 } }
    ]);

    // Calculate summary statistics
    const totalMembers = await ProjectMember.countDocuments({ projectId: { $in: projectIds } });
    const totalHours = resourceAllocation.reduce((sum, ra) => sum + (ra.taskCount * 8), 0); // Estimate 8 hours per task
    const averageUtilization = resourceAllocation.length > 0 ? 
      resourceAllocation.reduce((sum, ra) => sum + ra.budgetUtilization, 0) / resourceAllocation.length : 0;
    const overallocated = resourceAllocation.filter(ra => ra.budgetUtilization > 100).length;

    res.status(200).json({
      timeRange: parseInt(timeRange),
      summary: {
        totalMembers,
        totalHours,
        averageUtilization: Math.round(averageUtilization * 10) / 10,
        overallocated
      },
      budgetAnalysis,
      expenseTrends,
      expenseByCategory,
      resourceAllocation,
      timeUtilization
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resource utilization analytics', error: error.message });
  }
};

// Get team performance analytics (for projects where user is admin)
export const getTeamPerformanceAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get projects where user is admin or creator
    const adminProjects = await ProjectMember.find({ 
      userId, 
      role: 'admin' 
    }).populate('projectId');
    
    const createdProjects = await Project.find({ createdBy: userId });
    
    const allProjects = [
      ...adminProjects.map(pm => pm.projectId),
      ...createdProjects
    ];
    
    const uniqueProjects = allProjects.filter((project, index, self) => 
      index === self.findIndex(p => p._id.toString() === project._id.toString())
    );

    if (uniqueProjects.length === 0) {
      return res.status(200).json({
        timeRange: parseInt(timeRange),
        teamPerformance: [],
        teamProductivity: [],
        collaborationMetrics: {}
      });
    }

    const projectIds = uniqueProjects.map(p => p._id);

    // Team performance by project
    const teamPerformance = await Promise.all(
      uniqueProjects.map(async (project) => {
        const members = await ProjectMember.find({ projectId: project._id }).populate('userId', 'name email');
        
        const memberPerformance = await Promise.all(
          members.map(async (member) => {
            const memberTasks = await TaskMember.find({ userId: member.userId._id }).select('taskId');
            const memberTaskIds = memberTasks.map(tm => tm.taskId);
            
            const projectMemberTasks = await Task.find({
              _id: { $in: memberTaskIds },
              projectId: project._id
            });

            const completedTasks = projectMemberTasks.filter(task => task.status === 'Done').length;
            const totalTasks = projectMemberTasks.length;
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return {
              userId: member.userId._id,
              userName: member.userId.name,
              email: member.userId.email,
              role: member.role,
              totalTasks,
              completedTasks,
              completionRate: Math.round(completionRate * 10) / 10
            };
          })
        );

        return {
          projectId: project._id,
          projectName: project.name,
          members: memberPerformance
        };
      })
    );

    // Overall team productivity trends
    const teamProductivity = await Task.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          updatedAt: { $gte: startDate },
          status: 'Done'
        }
      },
      {
        $lookup: {
          from: 'taskmembers',
          localField: '_id',
          foreignField: 'taskId',
          as: 'taskMembers'
        }
      },
      {
        $unwind: '$taskMembers'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'taskMembers.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            userId: '$user._id',
            userName: '$user.name'
          },
          tasksCompleted: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }    ]);

    // Collaboration metrics
    const collaborationMetrics = {
      totalTeamMembers: await ProjectMember.countDocuments({ projectId: { $in: projectIds } }),
      averageTeamSize: projectIds.length > 0 ? 
        await ProjectMember.countDocuments({ projectId: { $in: projectIds } }) / projectIds.length : 0,
      crossProjectCollaboration: await ProjectMember.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: '$userId', projectCount: { $sum: 1 } } },
        { $match: { projectCount: { $gt: 1 } } },
        { $count: 'collaborators' }
      ])
    };

    // Calculate team summary statistics
    const allMembers = teamPerformance.flatMap(tp => tp.members);
    const averagePerformance = allMembers.length > 0 ? 
      allMembers.reduce((sum, member) => sum + member.completionRate, 0) / allMembers.length : 0;
    const tasksCompleted = allMembers.reduce((sum, member) => sum + member.completedTasks, 0);
    const collaborationScore = collaborationMetrics.crossProjectCollaboration[0]?.collaborators > 0 ? 
      (collaborationMetrics.crossProjectCollaboration[0].collaborators / collaborationMetrics.totalTeamMembers) * 100 : 0;
    const averageResponseTime = 24; // Mock data - would need real chat/response data

    res.status(200).json({
      timeRange: parseInt(timeRange),
      summary: {
        averagePerformance: Math.round(averagePerformance * 10) / 10,
        tasksCompleted,
        collaborationScore: Math.round(collaborationScore * 10) / 10,
        averageResponseTime
      },
      teamPerformance,
      teamProductivity,
      collaborationMetrics: {
        ...collaborationMetrics,
        crossProjectCollaboration: collaborationMetrics.crossProjectCollaboration[0]?.collaborators || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team performance analytics', error: error.message });
  }
};

// Get comprehensive dashboard analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get user's projects and tasks
    const userProjects = await ProjectMember.find({ userId }).populate('projectId');
    const projectIds = userProjects.map(pm => pm.projectId._id);

    const userTasks = await TaskMember.find({ userId }).select('taskId');
    const taskIds = userTasks.map(tm => tm.taskId);    // Key performance indicators
    const totalProjects = projectIds.length;
    const totalTasks = taskIds.length;
    const activeTasks = await Task.countDocuments({ 
      _id: { $in: taskIds }, 
      status: { $ne: 'Done' } 
    });
    const completedTasks = await Task.countDocuments({ 
      _id: { $in: taskIds }, 
      status: 'Done' 
    });
    const overdueTasks = await Task.countDocuments({
      _id: { $in: taskIds },
      dueDate: { $lt: new Date() },
      status: { $ne: 'Done' }
    });

    // Budget overview
    const totalBudget = userProjects.reduce((sum, pm) => 
      sum + (pm.projectId.budget?.totalBudget || 0), 0
    );

    const totalExpenses = await Expense.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalSpent = totalExpenses[0]?.total || 0;

    // Recent activity
    const recentTasks = await Task.find({
      _id: { $in: taskIds },
      updatedAt: { $gte: startDate }
    }).sort({ updatedAt: -1 }).limit(5).populate('projectId', 'name');

    const recentExpenses = await Expense.find({
      projectId: { $in: projectIds },
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 }).limit(5).populate('projectId', 'name');

    // Trending insights
    const insights = [];

    // Productivity insight
    const productivityTrend = await Task.aggregate([
      {
        $match: {
          _id: { $in: taskIds },
          status: 'Done',
          updatedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $week: '$updatedAt' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (productivityTrend.length >= 2) {
      const latest = productivityTrend[productivityTrend.length - 1].count;
      const previous = productivityTrend[productivityTrend.length - 2].count;
      const change = ((latest - previous) / previous) * 100;
      
      insights.push({
        type: 'productivity',
        title: 'Task Completion Trend',
        message: `Your task completion rate has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% this week`,
        trend: change > 0 ? 'up' : 'down',
        value: change
      });
    }

    // Budget insight
    if (totalBudget > 0) {
      const utilization = (totalSpent / totalBudget) * 100;
      if (utilization > 80) {
        insights.push({
          type: 'budget',
          title: 'Budget Alert',
          message: `You've used ${utilization.toFixed(1)}% of your total budget across all projects`,
          trend: 'warning',
          value: utilization
        });
      }
    }

    res.status(200).json({
      timeRange: parseInt(timeRange),      kpis: {
        totalProjects,
        totalTasks,
        activeTasks,
        completedTasks,
        overdueTasks,
        totalBudget,
        totalSpent,
        budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      },
      recentActivity: {
        tasks: recentTasks,
        expenses: recentExpenses
      },
      insights
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard analytics', error: error.message });
  }
};
