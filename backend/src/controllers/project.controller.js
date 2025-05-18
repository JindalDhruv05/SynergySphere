import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import User from '../models/user.model.js'; 
import { createGoogleDriveFolder } from '../services/googleDrive.js';

// Get all projects for current user
export const getProjects = async (req, res) => {
  try {
    // Find all projects where user is a member
    const projectMembers = await ProjectMember.find({ userId: req.user.id });
    const projectIds = projectMembers.map(pm => pm.projectId);
    
    // Also include projects created by the user
    const projects = await Project.find({
      $or: [
        { _id: { $in: projectIds } },
        { createdBy: req.user.id }
      ]
    }).populate('createdBy', 'name email avatar');
    
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

// Get project by ID
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};

// Create new project
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Create Google Drive folder
    let googleDriveFolderId = null;
    if (req.user.googleDriveAccessToken) {
      const folder = await createGoogleDriveFolder(
        name,
        req.user.googleDriveAccessToken,
        req.user.googleDriveRefreshToken
      );
      googleDriveFolderId = folder.id;
    }
    
    const project = new Project({
      name,
      description,
      createdBy: req.user.id,
      googleDriveFolderId
    });
    
    await project.save();
    
    // Add creator as project admin
    const projectMember = new ProjectMember({
      projectId: project._id,
      userId: req.user.id,
      role: 'admin'
    });
    
    await projectMember.save();
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    
    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Delete project and all related data
    // In a real application, you might want to use transactions
    await Project.findByIdAndDelete(req.params.id);
    await ProjectMember.deleteMany({ projectId: req.params.id });
    
    // Delete Google Drive folder if exists
    // Implementation depends on your Google Drive service
    
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

// Get project members
export const getProjectMembers = async (req, res) => {
  try {
    const members = await ProjectMember.find({ projectId: req.params.id })
      .populate('userId', 'name email avatar');
    
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project members', error: error.message });
  }
};

// Add project member
export const addProjectMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    const existingMember = await ProjectMember.findOne({
      projectId: req.params.id,
      userId
    });
    
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }
    
    const projectMember = new ProjectMember({
      projectId: req.params.id,
      userId,
      role: role || 'member'
    });
    
    await projectMember.save();
    
    res.status(201).json(projectMember);
  } catch (error) {
    res.status(500).json({ message: 'Error adding project member', error: error.message });
  }
};

// Update project member
export const updateProjectMember = async (req, res) => {
  try {
    const { role } = req.body;
    
    const updatedMember = await ProjectMember.findOneAndUpdate(
      { projectId: req.params.id, userId: req.params.userId },
      { role },
      { new: true }
    );
    
    if (!updatedMember) {
      return res.status(404).json({ message: 'Project member not found' });
    }
    
    res.status(200).json(updatedMember);
  } catch (error) {
    res.status(500).json({ message: 'Error updating project member', error: error.message });
  }
};

// Remove project member
export const removeProjectMember = async (req, res) => {
  try {
    const deletedMember = await ProjectMember.findOneAndDelete({
      projectId: req.params.id,
      userId: req.params.userId
    });
    
    if (!deletedMember) {
      return res.status(404).json({ message: 'Project member not found' });
    }
    
    res.status(200).json({ message: 'Project member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing project member', error: error.message });
  }
};
