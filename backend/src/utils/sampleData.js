// Sample data generator for analytics testing
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import ProjectMember from '../models/projectMember.model.js';
import TaskMember from '../models/taskMember.model.js';
import Expense from '../models/expense.model.js';

export const generateSampleData = async () => {
  try {
    console.log('Generating sample analytics data...');

    // Sample users (if they don't exist)
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Project Manager'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com', 
        password: 'password123',
        role: 'Developer'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: 'password123',
        role: 'Designer'
      }
    ];

    // Create users if they don't exist
    const users = [];
    for (const userData of sampleUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = new User(userData);
        await user.save();
      }
      users.push(user);
    }

    // Sample projects
    const sampleProjects = [
      {
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        budget: 50000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        status: 'in-progress',
        ownerId: users[0]._id,
        progress: 75
      },
      {
        name: 'Mobile App Development',
        description: 'Develop cross-platform mobile application',
        budget: 80000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-31'),
        status: 'in-progress',
        ownerId: users[0]._id,
        progress: 45
      },
      {
        name: 'Marketing Campaign',
        description: 'Q2 marketing campaign launch',
        budget: 25000,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
        status: 'completed',
        ownerId: users[1]._id,
        progress: 100
      }
    ];

    // Create projects
    const projects = [];
    for (const projectData of sampleProjects) {
      let project = await Project.findOne({ name: projectData.name });
      if (!project) {
        project = new Project(projectData);
        await project.save();
      }
      projects.push(project);
    }

    // Create project members
    for (const project of projects) {
      for (const user of users) {
        const existingMember = await ProjectMember.findOne({
          projectId: project._id,
          userId: user._id
        });
        
        if (!existingMember) {
          const member = new ProjectMember({
            projectId: project._id,
            userId: user._id,
            role: user._id.equals(project.ownerId) ? 'owner' : 'member',
            joinedAt: new Date()
          });
          await member.save();
        }
      }
    }

    // Sample tasks with varied dates for trend analysis
    const sampleTasks = [
      // Website Redesign tasks
      {
        title: 'Design Homepage Layout',
        description: 'Create wireframes and design for homepage',
        projectId: projects[0]._id,
        assigneeId: users[2]._id,
        priority: 'high',
        status: 'Done',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-01')
      },
      {
        title: 'Implement Responsive Design',
        description: 'Make the design responsive for all devices',
        projectId: projects[0]._id,
        assigneeId: users[1]._id,
        priority: 'high',
        status: 'Done',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-03-15')
      },
      {
        title: 'Content Management Integration',
        description: 'Integrate CMS for easy content updates',
        projectId: projects[0]._id,
        assigneeId: users[1]._id,
        priority: 'medium',
        status: 'In Progress',
        createdAt: new Date('2024-03-01')
      },
      
      // Mobile App tasks
      {
        title: 'User Authentication Module',
        description: 'Implement user login and registration',
        projectId: projects[1]._id,
        assigneeId: users[1]._id,
        priority: 'high',
        status: 'Done',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-03-30')
      },
      {
        title: 'Dashboard UI Design',
        description: 'Design the main dashboard interface',
        projectId: projects[1]._id,
        assigneeId: users[2]._id,
        priority: 'medium',
        status: 'In Progress',
        createdAt: new Date('2024-03-15')
      },
      
      // Marketing Campaign tasks
      {
        title: 'Market Research Analysis',
        description: 'Analyze target market and competitors',
        projectId: projects[2]._id,
        assigneeId: users[0]._id,
        priority: 'high',
        status: 'Done',
        createdAt: new Date('2024-04-01'),
        updatedAt: new Date('2024-04-15')
      },
      {
        title: 'Creative Asset Development',
        description: 'Create marketing materials and assets',
        projectId: projects[2]._id,
        assigneeId: users[2]._id,
        priority: 'medium',
        status: 'Done',
        createdAt: new Date('2024-04-15'),
        updatedAt: new Date('2024-05-01')
      },
      {
        title: 'Campaign Launch',
        description: 'Execute the marketing campaign',
        projectId: projects[2]._id,
        assigneeId: users[1]._id,
        priority: 'high',
        status: 'Done',
        createdAt: new Date('2024-05-01'),
        updatedAt: new Date('2024-05-30')
      }
    ];

    // Create tasks
    const tasks = [];
    for (const taskData of sampleTasks) {
      let task = await Task.findOne({ title: taskData.title, projectId: taskData.projectId });
      if (!task) {
        task = new Task(taskData);
        await task.save();
      }
      tasks.push(task);
    }

    // Create task members
    for (const task of tasks) {
      if (task.assigneeId) {
        const existingTaskMember = await TaskMember.findOne({
          taskId: task._id,
          userId: task.assigneeId
        });
        
        if (!existingTaskMember) {
          const taskMember = new TaskMember({
            taskId: task._id,
            userId: task.assigneeId,
            role: 'assignee',
            assignedAt: task.createdAt
          });
          await taskMember.save();
        }
      }
    }

    // Sample expenses
    const sampleExpenses = [
      {
        projectId: projects[0]._id,
        userId: users[0]._id,
        amount: 2500,
        description: 'Design software licenses',
        category: 'Software',
        date: new Date('2024-01-20')
      },
      {
        projectId: projects[0]._id,
        userId: users[1]._id,
        amount: 1800,
        description: 'Development tools',
        category: 'Software',
        date: new Date('2024-02-10')
      },
      {
        projectId: projects[1]._id,
        userId: users[1]._id,
        amount: 3200,
        description: 'Mobile testing devices',
        category: 'Hardware',
        date: new Date('2024-03-05')
      },
      {
        projectId: projects[2]._id,
        userId: users[2]._id,
        amount: 5000,
        description: 'Advertising spend',
        category: 'Marketing',
        date: new Date('2024-04-20')
      }
    ];

    // Create expenses
    for (const expenseData of sampleExpenses) {
      const existingExpense = await Expense.findOne({
        projectId: expenseData.projectId,
        amount: expenseData.amount,
        description: expenseData.description
      });
      
      if (!existingExpense) {
        const expense = new Expense(expenseData);
        await expense.save();
      }
    }

    console.log('Sample data generated successfully!');
    console.log(`Created ${users.length} users, ${projects.length} projects, ${tasks.length} tasks`);
    
    return {
      users,
      projects,
      tasks,
      message: 'Sample data generated successfully'
    };
    
  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error;
  }
};
