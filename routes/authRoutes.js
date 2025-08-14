const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const {
  registerValidationRules,
  loginValidationRules,
  validate,
} = require('../validators/authValidator');

// Route POST pour l'inscription d'un nouvel utilisateur
router.post('/register', registerValidationRules(), validate, registerUser);

// Route POST pour la connexion d'un utilisateur existant
// Ajout de la validation pour la cohérence et la sécurité
router.post('/login', loginValidationRules(), validate, loginUser);

module.exports = router;
