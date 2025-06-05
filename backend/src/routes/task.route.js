import express from "express";
import { 
  getTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask,
  getSubtasks,
  createSubtask,
  getTaskMembers,
  addTaskMember,
  updateTaskMember,
  removeTaskMember,
  getTaskComments,
  addTaskComment,
  deleteTaskComment,
  updateTaskBudget,
  getTaskBudgetOverview
} from '../controllers/task.controller.js';
import { verifyToken, isProjectMember, isTaskMember, isProjectAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getTasks);
router.get('/:id', verifyToken, isTaskMember, getTaskById);
router.post('/', verifyToken, isProjectMember, createTask);
router.put('/:id', verifyToken, isTaskMember, updateTask);
router.delete('/:id', verifyToken, isProjectAdmin, deleteTask);

// Subtasks
router.get('/:id/subtasks', verifyToken, isTaskMember, getSubtasks);
router.post('/:id/subtasks', verifyToken, isTaskMember, createSubtask);

// Task members
router.get('/:id/members', verifyToken, isTaskMember, getTaskMembers);
router.post('/:id/members', verifyToken, isTaskMember, addTaskMember);
router.put('/:id/members/:userId', verifyToken, isTaskMember, updateTaskMember);
router.delete('/:id/members/:userId', verifyToken, isProjectAdmin, removeTaskMember);

// Comments
router.get('/:id/comments', verifyToken, isTaskMember, getTaskComments);
router.post('/:id/comments', verifyToken, isTaskMember, addTaskComment);
router.delete('/:id/comments/:commentId', verifyToken, isTaskMember, deleteTaskComment);

// Budget
router.put('/:id/budget', verifyToken, isTaskMember, updateTaskBudget);
router.get('/:id/budget', verifyToken, isTaskMember, getTaskBudgetOverview);

export default router;
