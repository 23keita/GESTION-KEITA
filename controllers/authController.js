const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    S'inscrire
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
 
  // La validation (champs manquants, email déjà utilisé) est maintenant
  // gérée par le middleware express-validator (authValidator.js).
  // Le contrôleur est plus propre et se concentre sur sa logique métier.
  // Créer l'utilisateur (le mot de passe est haché via le middleware du modèle)
  const user = await User.create({
    username,
    email,
    password,
  });

  // Si la création réussit, user sera défini. Si elle échoue, une erreur
  // sera levée et capturée par express-async-handler. Le bloc `else` est donc redondant.
  res.status(201).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    token: generateToken(user._id),
  });
});

// @desc    Se connecter
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Vérifier l'email de l'utilisateur
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Email ou mot de passe invalide');
  }
});

// Générer le token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

module.exports = {
  registerUser,
  loginUser,
};
