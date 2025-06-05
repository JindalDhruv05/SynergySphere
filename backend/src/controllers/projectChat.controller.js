import ProjectChat from '../models/projectChat.model.js';
import Chat from '../models/chat.model.js';
import Project from '../models/project.model.js';

// Get project chat
export const getProjectChat = async (req, res) => {
  try {
    let projectChat = await ProjectChat.findOne({ projectId: req.params.projectId }).populate('chatId');
    
    // If no chat exists for this project, create one
    if (!projectChat) {
      // Fetch project for naming
      const project = await Project.findById(req.params.projectId).select('name');
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Create chat document
      const chatDoc = new Chat({ type: 'project', name: `${project.name} Chat` });
      await chatDoc.save();
      
      // Create projectChat and sync members
      projectChat = new ProjectChat({ chatId: chatDoc._id, projectId: req.params.projectId });
      await projectChat.save();
      await projectChat.syncWithProjectMembers();
      await projectChat.populate('chatId');
    } else {
      // Dynamically set chat name to project name
      const project = await Project.findById(req.params.projectId).select('name');
      if (project && projectChat.chatId) {
        projectChat.chatId.name = project.name;
      }
    }
    
    res.status(200).json(projectChat);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project chat', error: error.message });
  }
};

// Create project chat
export const createProjectChat = async (req, res) => {
  try {
    // Check if project exists
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if project chat already exists
    const existingChat = await ProjectChat.findOne({ projectId: req.params.projectId });
    if (existingChat) {
      return res.status(400).json({ message: 'Project chat already exists' });
    }
    
    // Create chat
    const chat = new Chat({
      type: 'project',
      name: `${project.name} Chat`
    });
    
    await chat.save();
    
    // Create project chat
    const projectChat = new ProjectChat({
      chatId: chat._id,
      projectId: req.params.projectId
    });
    
    await projectChat.save();
    
    // Sync with project members
    await projectChat.syncWithProjectMembers();
    
    res.status(201).json(projectChat);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project chat', error: error.message });
  }
};

// Sync project chat members
export const syncProjectChatMembers = async (req, res) => {
  try {
    const projectChat = await ProjectChat.findOne({ projectId: req.params.projectId });
    
    if (!projectChat) {
      return res.status(404).json({ message: 'Project chat not found' });
    }
    
    await projectChat.syncWithProjectMembers();
    
    res.status(200).json({ message: 'Project chat members synced successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing project chat members', error: error.message });
  }
};
