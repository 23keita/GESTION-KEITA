const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connecté: ${conn.connection.host}`);
  } catch (error) {
    // L'erreur est déjà gérée dans server.js, mais un log ici peut être utile pour le débogage.
    console.error(`Erreur de connexion à MongoDB: ${error.message}`);
    throw error; // Relance l'erreur pour que server.js puisse la catcher et arrêter le processus.
  }
};

module.exports = connectDB;