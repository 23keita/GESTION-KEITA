const dotenv = require('dotenv');

// Charger les variables d'environnement AVANT tout le reste.
// C'est crucial pour que toutes les variables soient disponibles dans toute l'application.
dotenv.config();

// Vérification des variables d'environnement essentielles au démarrage
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`ERREUR: Variables d'environnement manquantes : ${missingEnv.join(', ')}`);
  console.error("Veuillez vous assurer qu'un fichier .env est présent et correctement configuré à la racine du projet.");
  process.exit(1);
}

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(
        `Serveur démarré en mode ${process.env.NODE_ENV || 'development'} sur le port ${PORT}`
      );
      console.log(`Accédez au serveur via : http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Échec de la connexion à la base de données, le serveur ne démarre pas.', error);
    process.exit(1);
  }
};

startServer();
