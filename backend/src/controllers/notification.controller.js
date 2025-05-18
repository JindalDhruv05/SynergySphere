import Notification from '../models/notification.model.js';

// Get notifications for current user
export const getUserNotifications = async (req, res) => {
  try {
    const { read, limit = 20, skip = 0 } = req.query;
    
    const query = { userId: req.user.id };
    
    // Filter by read status if provided
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));
    
    const total = await Notification.countDocuments(query);
    
    res.status(200).json({
      notifications,
      total,
      hasMore: total > Number(skip) + Number(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Get notification by ID
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to current user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this notification' });
    }
    
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification', error: error.message });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to current user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
  }
};

// Delete notification (continued)
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to current user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
    
    await Notification.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

// Create notification (utility function for internal use)
export const createNotification = async (userId, type, content, relatedItemId) => {
  try {
    const notification = new Notification({
      userId,
      type,
      content,
      relatedItemId,
      read: false
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });
    
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notification count', error: error.message });
  }
};

// Delete all read notifications
export const deleteReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ 
      userId: req.user.id, 
      read: true 
    });
    
    res.status(200).json({ 
      message: 'Read notifications deleted successfully',
      count: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting read notifications', error: error.message });
  }
};
