const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Créer une nouvelle tâche
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status, priority } = req.body;
  // La validation est gérée en amont par le middleware `taskValidator`.
  let task = await Task.create({
    title,
    description,
    assignedTo,
    assignedBy: req.user._id,
    status,
    priority,
  });

  // Populate pour renvoyer les informations utilisateur complètes, comme pour getTasks
  task = await task.populate([
    { path: 'assignedTo', select: 'username email' },
    { path: 'assignedBy', select: 'username email' },
  ]);

  res.status(201).json(task);
});

// @desc    Obtenir toutes les tâches (avec pagination et filtres)
// @route   GET /api/tasks?status=en_cours&priority=faible&assignedTo=...&sort=-createdAt&page=1&limit=10
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  // --- 1. Filtrage ---
  // Copier req.query pour ne pas modifier l'original
  const queryObj = { ...req.query };
  // Définir les champs à exclure du filtrage (car ils servent à autre chose)
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  // Supprimer les champs exclus du queryObj
  excludedFields.forEach((el) => delete queryObj[el]);

  // Construire la requête de base avec les filtres restants
  let query = Task.find(queryObj);

  // --- 2. Tri ---
  if (req.query.sort) {
    // Permet de trier sur plusieurs champs, ex: sort=priority,-createdAt
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    // Tri par défaut si non spécifié (les plus récents en premier)
    query = query.sort('-createdAt');
  }

  // --- 3. Pagination ---
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // --- 4. Exécution de la requête ---
  const tasks = await query
    .populate('assignedTo', 'username email')
    .populate('assignedBy', 'username email');

  // Obtenir le nombre total de documents pour la pagination (en utilisant les mêmes filtres)
  const totalTasks = await Task.countDocuments(queryObj);

  res.status(200).json({
    count: tasks.length,
    page,
    totalPages: Math.ceil(totalTasks / limit),
    totalTasks,
    tasks,
  });
});

// @desc    Mettre à jour une tâche
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  // La recherche de la tâche et la vérification des permissions sont maintenant
  // gérées par le middleware `canEditTask`.

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Retourne le document modifié
    runValidators: true, // Exécute les validateurs du schéma Mongoose
  })
    .populate('assignedTo', 'username email')
    .populate('assignedBy', 'username email');

  res.status(200).json(updatedTask);
});

// @desc    Supprimer une tâche
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  // La recherche de la tâche et la vérification des permissions sont maintenant
  // gérées par le middleware `canDeleteTask`. La tâche est disponible dans `req.task`.

  await req.task.deleteOne();

  // Renvoyer l'ID de la tâche supprimée est utile pour le client
  res.status(200).json({ id: req.params.id, message: 'Tâche supprimée avec succès' });
});

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
