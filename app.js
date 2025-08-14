const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const { errorHandler } = require('./middlewares/errorMiddleware');
const mongoSanitizeMiddleware = require('./middlewares/mongoSanitize.middleware');

const app = express();

// --- Middlewares de Sécurité et de Logging ---

// Définit des en-têtes HTTP de sécurité (Content-Security-Policy, X-XSS-Protection, etc.)
app.use(helmet());

// Logger les requêtes HTTP en mode développement
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Configuration CORS plus stricte pour la production
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL // Assurez-vous de définir FRONTEND_URL dans votre .env
      : '*', // Moins restrictif pour le développement
  credentials: true,
};
app.use(cors(corsOptions));

// Limite le nombre de requêtes par IP pour prévenir les attaques par force brute
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre de 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer après 15 minutes.',
});
// Appliquer le rate limiting à toutes les routes /api
app.use('/api', limiter);

// --- Middlewares pour le Body Parser ---
// Permet de parser le JSON et limite la taille du payload
app.use(express.json({ limit: '10kb' }));
// Permet de parser les données de formulaire URL-encoded et limite la taille
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- Middlewares de Sécurité contre les Injections ---
// "Nettoie" les données reçues pour prévenir les injections NoSQL (MongoDB)
app.use(mongoSanitizeMiddleware);

// Prévient la pollution des paramètres HTTP (ex: /search?sort=name&sort=date)
app.use(
  hpp({
    whitelist: [
      // Ajoutez ici les paramètres que vous autorisez en double, ex: 'status', 'priority' pour les filtres
    ],
  })
);

// --- Routes ---

// Route racine pour un message de bienvenue ou un statut de l'API
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Bienvenue sur l'API de l'application de gestion de tâches.",
    status: 'ok',
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));

// --- Gestion des Erreurs ---
// Gérer les routes non trouvées (404)
app.use((req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Middleware de gestion des erreurs (doit être le dernier middleware)
app.use(errorHandler);

module.exports = app;