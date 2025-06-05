import express from "express";
import { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  getProjectMembers,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  updateProjectBudget,
  getProjectTasksBudget,
  getProjectCompletion
} from '../controllers/project.controller.js';
import { verifyToken, isProjectMember, isProjectAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getProjects);
router.get('/:id', verifyToken, isProjectMember, getProjectById);
router.post('/', verifyToken, createProject);
router.put('/:id', verifyToken, isProjectAdmin, updateProject);
router.delete('/:id', verifyToken, isProjectAdmin, deleteProject);

// Project budget
router.put('/:id/budget', verifyToken, isProjectAdmin, updateProjectBudget);
router.get('/:id/tasks-budget', verifyToken, isProjectMember, getProjectTasksBudget);

// Project completion
router.get('/:id/completion', verifyToken, isProjectMember, getProjectCompletion);

// Project members
router.get('/:id/members', verifyToken, isProjectMember, getProjectMembers);
router.post('/:id/members', verifyToken, isProjectAdmin, addProjectMember);
router.put('/:id/members/:userId', verifyToken, isProjectAdmin, updateProjectMember);
router.delete('/:id/members/:userId', verifyToken, isProjectAdmin, removeProjectMember);

export default router;
