import ProjectDocument from '../models/projectDocument.model.js';
import DriveDocument from '../models/driveDocument.model.js';
import Project from '../models/project.model.js';

// Get project documents
export const getProjectDocuments = async (req, res) => {
  try {
    const projectDocuments = await ProjectDocument.find({ projectId: req.params.projectId })
      .populate({
        path: 'documentId',
        model: 'DriveDocument', // Explicitly specify model
        populate: {
          path: 'uploadedBy',
          model: 'User', // Explicitly specify model
          select: 'name email avatar'
        }
      });
    
    // Filter out any null documentId objects that might occur if a ProjectDocument record exists with a missing documentId
    const documents = projectDocuments
      .filter(pd => pd.documentId) 
      .map(pd => pd.documentId);
    
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project documents', error: error.message });
  }
};

// Add document to project
export const addDocumentToProject = async (req, res) => {
  try {
    const { documentId } = req.body;
    
    // Check if document exists
    const document = await DriveDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if project exists
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if document is already linked to project
    const existingLink = await ProjectDocument.findOne({
      documentId,
      projectId: req.params.projectId
    });
    
    if (existingLink) {
      return res.status(400).json({ message: 'Document is already linked to this project' });
    }
    
    const projectDocument = new ProjectDocument({
      documentId,
      projectId: req.params.projectId
    });
    
    await projectDocument.save();
    
    res.status(201).json(projectDocument);
  } catch (error) {
    res.status(500).json({ message: 'Error adding document to project', error: error.message });
  }
};

// Remove document from project
export const removeDocumentFromProject = async (req, res) => {
  try {
    const deletedLink = await ProjectDocument.findOneAndDelete({
      documentId: req.params.documentId,
      projectId: req.params.projectId
    });
    
    if (!deletedLink) {
      return res.status(404).json({ message: 'Document not linked to this project' });
    }
    
    res.status(200).json({ message: 'Document removed from project successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing document from project', error: error.message });
  }
};
