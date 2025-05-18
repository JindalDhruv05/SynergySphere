import TaskDocument from '../models/taskDocument.model.js';
import DriveDocument from '../models/driveDocument.model.js';
import Task from '../models/task.model.js';

// Get task documents
export const getTaskDocuments = async (req, res) => {
  try {
    const taskDocuments = await TaskDocument.find({ taskId: req.params.taskId })
      .populate({
        path: 'documentId',
        populate: {
          path: 'uploadedBy',
          select: 'name email avatar'
        }
      });
    
    const documents = taskDocuments.map(td => td.documentId);
    
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task documents', error: error.message });
  }
};

// Add document to task
export const addDocumentToTask = async (req, res) => {
  try {
    const { documentId } = req.body;
    
    // Check if document exists
    const document = await DriveDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if task exists
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if document is already linked to task
    const existingLink = await TaskDocument.findOne({
      documentId,
      taskId: req.params.taskId
    });
    
    if (existingLink) {
      return res.status(400).json({ message: 'Document is already linked to this task' });
    }
    
    const taskDocument = new TaskDocument({
      documentId,
      taskId: req.params.taskId
    });
    
    await taskDocument.save();
    
    res.status(201).json(taskDocument);
  } catch (error) {
    res.status(500).json({ message: 'Error adding document to task', error: error.message });
  }
};

// Remove document from task
export const removeDocumentFromTask = async (req, res) => {
  try {
    const deletedLink = await TaskDocument.findOneAndDelete({
      documentId: req.params.documentId,
      taskId: req.params.taskId
    });
    
    if (!deletedLink) {
      return res.status(404).json({ message: 'Document not linked to this task' });
    }
    
    res.status(200).json({ message: 'Document removed from task successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing document from task', error: error.message });
  }
};
