const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const {
  createTaskValidationRules,
  updateTaskValidationRules,
  validate,
} = require('../validators/taskValidator');
const {
  canEditTask,
  canDeleteTask,
} = require('../middlewares/permissionMiddleware');
const { param } = require('express-validator');

// Appliquer la protection à toutes les routes de ce fichier
router.use(protect);

router
  .route('/')
  .get(getTasks)
  .post(createTaskValidationRules(), validate, createTask);

router
  .route('/:id')
  .put(updateTaskValidationRules(), validate, canEditTask, updateTask)
  .delete(param('id').isMongoId().withMessage("L'ID de la tâche n'est pas valide."), validate, canDeleteTask, deleteTask);

module.exports = router;