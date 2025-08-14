const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');

// Ces valeurs devraient idéalement provenir du modèle Task pour rester synchronisées.
const VALID_STATUSES = ['à_faire', 'en_cours', 'terminée'];
const VALID_PRIORITIES = ['faible', 'moyenne', 'élevée'];

/**
 * Définit les règles de validation pour la création d'une tâche.
 */
const createTaskValidationRules = () => {
  return [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Le titre est obligatoire.')
      .isLength({ min: 3 })
      .withMessage('Le titre doit contenir au moins 3 caractères.'),

    body('description').optional().trim(),

    body('assignedTo')
      .notEmpty()
      .withMessage("L'ID de l'utilisateur assigné est obligatoire.")
      .isMongoId()
      .withMessage("L'ID de l'utilisateur assigné n'est pas valide.")
      .custom(async (value) => {
        const user = await User.findById(value);
        if (!user) {
          return Promise.reject("L'utilisateur assigné n'existe pas.");
        }
      }),

    body('status')
      .optional()
      .isIn(VALID_STATUSES)
      .withMessage(`Le statut doit être l'un des suivants : ${VALID_STATUSES.join(', ')}.`),

    body('priority')
      .optional()
      .isIn(VALID_PRIORITIES)
      .withMessage(`La priorité doit être l'une des suivantes : ${['faible', 'moyenne', 'élevée'].join(', ')}.`),
  ];
};

/**
 * Définit les règles de validation pour la mise à jour d'une tâche.
 */
const updateTaskValidationRules = () => {
  return [
    param('id').isMongoId().withMessage("L'ID de la tâche n'est pas valide."),

    // Les champs du body sont optionnels lors d'une mise à jour
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Le titre doit contenir au moins 3 caractères.'),

    body('description').optional().trim(),

    body('assignedTo')
      .optional()
      .isMongoId()
      .withMessage("L'ID de l'utilisateur assigné n'est pas valide.")
      .custom(async (value) => {
        const user = await User.findById(value);
        if (!user) {
          return Promise.reject("L'utilisateur assigné n'existe pas.");
        }
      }),

    body('status')
      .optional()
      .isIn(VALID_STATUSES)
      .withMessage(`Le statut doit être l'un des suivants : ${VALID_STATUSES.join(', ')}.`),

    body('priority')
      .optional()
      .isIn(VALID_PRIORITIES)
      .withMessage(`La priorité doit être l'une des suivantes : ${['faible', 'moyenne', 'élevée'].join(', ')}.`),
  ];
};

/**
 * Middleware qui vérifie les erreurs de validation et renvoie une réponse 422 si nécessaire.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  // S'il y a des erreurs, on les renvoie au client
  return res.status(422).json({ errors: errors.array() });
};

module.exports = {
  createTaskValidationRules,
  updateTaskValidationRules,
  validate,
};