const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Veuillez entrer un nom d\'utilisateur'],
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: [true, 'Veuillez entrer une adresse email'],
      unique: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Veuillez entrer une adresse email valide',
      ],
    },
    password: {
      type: String,
      required: [true, 'Veuillez entrer un mot de passe'],
      minlength: [6, 'Le mot de passe doit avoir au moins 6 caractères'],
    },
    role: {
      type: String,
      enum: ['membre', 'admin'],
      default: 'membre',
    },
  },
  {
    timestamps: true, // Ajoute automatiquement les champs createdAt et updatedAt
  }
);

// Middleware Mongoose pour hacher le mot de passe avant de sauvegarder l'utilisateur
UserSchema.pre('save', async function (next) {
  // Ne hache le mot de passe que si il a été modifié (ou est nouveau)
  if (!this.isModified('password')) {
    return next();
  }

  // Génère un "salt" et hache le mot de passe
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer les mots de passe lors de la connexion
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
