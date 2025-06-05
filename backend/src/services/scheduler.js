import cron from 'node-cron';
import Task from '../models/task.model.js';
import TaskMember from '../models/taskMember.model.js';
import ProjectInvitation from '../models/projectInvitation.model.js';
import { createNotification } from '../controllers/notification.controller.js';
import { getSocketInstance } from '../socket/socketHandlers.js';

// Check for approaching deadlines - runs every hour
export const scheduleDeadlineNotifications = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('🕐 Running deadline notification check...');
    
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Find tasks due within 24 hours or 7 days that are not completed
      const dueTasks = await Task.find({
        dueDate: {
          $gte: now,
          $lte: nextWeek
        },
        status: { $ne: 'Done' }
      });
      
      console.log(`📋 Found ${dueTasks.length} tasks with approaching deadlines`);
      
      for (const task of dueTasks) {
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        
        let notificationType = null;
        let message = '';
        
        // Determine notification type based on time remaining
        if (hoursDiff <= 24 && hoursDiff > 0) {
          notificationType = 'deadline_24h';
          message = `Task "${task.title}" is due in ${hoursDiff} hours`;
        } else if (hoursDiff <= 168 && hoursDiff > 24) { // 168 hours = 7 days
          const daysDiff = Math.floor(hoursDiff / 24);
          notificationType = 'deadline_7d';
          message = `Task "${task.title}" is due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
        }
        
        if (notificationType) {
          // Get task members
          const taskMembers = await TaskMember.find({ taskId: task._id }).populate('userId');
          const io = getSocketInstance();
          
          for (const member of taskMembers) {
            // Check if notification already sent for this period
            const existingNotification = await import('../models/notification.model.js')
              .then(({ default: Notification }) => 
                Notification.findOne({
                  userId: member.userId._id,
                  type: 'deadline_approaching',
                  relatedItemId: task._id,
                  createdAt: {
                    $gte: new Date(now.getTime() - 23 * 60 * 60 * 1000) // Within last 23 hours
                  }
                })
              );
            
            if (!existingNotification) {
              await createNotification({
                userId: member.userId._id,
                type: 'deadline_approaching',
                title: 'Deadline Approaching',
                message: message,
                relatedId: task._id,
                relatedType: 'task'
              });
              
              // Send real-time notification
              if (io) {
                io.to(`user:${member.userId._id}`).emit('notification', {
                  type: 'deadline_approaching',
                  title: 'Deadline Approaching',
                  message: message,
                  relatedId: task._id,
                  relatedType: 'task'
                });
              }
              
              console.log(`⏰ Sent deadline notification for task "${task.title}" to user ${member.userId.name}`);
            }
          }
        }
      }
      
      console.log('✅ Deadline notification check completed');
    } catch (error) {
      console.error('❌ Error in deadline notification check:', error);
    }
  });
  
  console.log('🕐 Deadline notification scheduler started');
};

// Check for overdue tasks - runs daily at 9 AM
export const scheduleOverdueNotifications = () => {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('🕘 Running overdue task notification check...');
    
    try {
      const now = new Date();
      
      // Find tasks that are overdue and not completed
      const overdueTasks = await Task.find({
        dueDate: { $lt: now },
        status: { $ne: 'Done' }
      });
      
      console.log(`📋 Found ${overdueTasks.length} overdue tasks`);
      
      for (const task of overdueTasks) {
        const taskMembers = await TaskMember.find({ taskId: task._id }).populate('userId');
        const io = getSocketInstance();
        
        const daysPastDue = Math.floor((now.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        const message = `Task "${task.title}" is ${daysPastDue} day${daysPastDue > 1 ? 's' : ''} overdue`;
        
        for (const member of taskMembers) {
          // Check if notification already sent today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const existingNotification = await import('../models/notification.model.js')
            .then(({ default: Notification }) => 
              Notification.findOne({
                userId: member.userId._id,
                type: 'deadline_approaching',
                relatedItemId: task._id,
                createdAt: { $gte: today }
              })
            );
          
          if (!existingNotification) {
            await createNotification({
              userId: member.userId._id,
              type: 'deadline_approaching',
              title: 'Task Overdue',
              message: message,
              relatedId: task._id,
              relatedType: 'task'
            });
            
            // Send real-time notification
            if (io) {
              io.to(`user:${member.userId._id}`).emit('notification', {
                type: 'deadline_approaching',
                title: 'Task Overdue',
                message: message,
                relatedId: task._id,
                relatedType: 'task'
              });
            }
            
            console.log(`⚠️ Sent overdue notification for task "${task.title}" to user ${member.userId.name}`);
          }
        }
      }
      
      console.log('✅ Overdue task notification check completed');
    } catch (error) {
      console.error('❌ Error in overdue task notification check:', error);
    }
  });
    console.log('🕘 Overdue task notification scheduler started');
};

// Clean up expired invitations - runs daily at midnight
export const scheduleInvitationCleanup = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Running expired invitations cleanup...');
    
    try {
      const now = new Date();
      
      // Find and delete expired invitations
      const result = await ProjectInvitation.deleteMany({
        expiresAt: { $lt: now },
        status: 'pending'
      });
      
      console.log(`🗑️ Cleaned up ${result.deletedCount} expired invitations`);
    } catch (error) {
      console.error('❌ Error in invitation cleanup:', error);
    }
  });
  
  console.log('🧹 Invitation cleanup scheduler started');
};

// Initialize all schedulers
export const initializeSchedulers = () => {
  scheduleDeadlineNotifications();
  scheduleOverdueNotifications();
  scheduleInvitationCleanup();
  console.log('📅 All notification schedulers initialized');
};
