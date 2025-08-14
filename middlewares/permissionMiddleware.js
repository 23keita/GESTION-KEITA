const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');

/**
 * Middleware pour vérifier si l'utilisateur a le droit de modifier une tâche.
 * Droits : admin, créateur de la tâche (assignedBy), ou personne assignée (assignedTo).
 */
const canEditTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Tâche non trouvée');
  }

  const isAllowed =
    req.user.role === 'admin' ||
    task.assignedBy.toString() === req.user._id.toString() ||
    task.assignedTo.toString() === req.user._id.toString();

  if (!isAllowed) {
    res.status(403); // 403 Forbidden
    throw new Error("Action non autorisée : vous n'avez pas les droits pour modifier cette tâche.");
  }

  // Attacher la tâche à la requête pour éviter une seconde recherche dans le contrôleur
  req.task = task;
  next();
});

/**
 * Middleware pour vérifier si l'utilisateur a le droit de supprimer une tâche.
 * Droits : admin ou créateur de la tâche (assignedBy).
 */
const canDeleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Tâche non trouvée');
  }

  const isAllowed =
    req.user.role === 'admin' ||
    task.assignedBy.toString() === req.user._id.toString();

  if (!isAllowed) {
    res.status(403); // 403 Forbidden
    throw new Error("Action non autorisée : vous n'avez pas les droits pour supprimer cette tâche.");
  }

  // Attacher la tâche à la requête pour éviter une seconde recherche dans le contrôleur
  req.task = task;
  next();
});

module.exports = {
  canEditTask,
  canDeleteTask,
};