const { body, validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * Définit les règles de validation pour la route d'inscription.
 */
const registerValidationRules = () => {
  return [
    // Le nom d'utilisateur ne doit pas être vide et doit faire au moins 3 caractères
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage("Le nom d'utilisateur doit contenir au moins 3 caractères."),

    // L'email doit être un email valide et ne doit pas déjà exister en BDD
    body('email')
      .isEmail()
      .withMessage('Veuillez fournir une adresse email valide.')
      .normalizeEmail()
      .custom(async (value) => {
        const user = await User.findOne({ email: value });
        if (user) {
          // Rejette la promesse si l'email est déjà utilisé
          return Promise.reject('Cette adresse email est déjà utilisée.');
        }
      }),

    // Le mot de passe doit faire au moins 6 caractères
    body('password')
      .isLength({ min: 6 })
      .withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
  ];
};

/**
 * Définit les règles de validation pour la route de connexion.
 */
const loginValidationRules = () => {
  return [
    // L'email doit être un email valide
    body('email')
      .isEmail()
      .withMessage('Veuillez fournir une adresse email valide.')
      .normalizeEmail(),
    // Le mot de passe ne doit pas être vide
    body('password').notEmpty().withMessage('Le mot de passe est requis.'),
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  // S'il y a des erreurs, on les renvoie au client
  return res.status(422).json({ errors: errors.array() });
};

module.exports = {
  registerValidationRules,
  loginValidationRules,
  validate,
};

