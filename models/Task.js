const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Veuillez ajouter un titre pour la tâche'],
      trim: true,
      maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
    },
    description: {
      type: String,
      maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
      default: '',
    },
    status: {
      type: String,
      enum: ['à_faire', 'en_cours', 'terminée'],
      default: 'à_faire',
    },
    priority: {
      type: String,
      enum: ['faible', 'moyenne', 'élevée'],
      default: 'faible',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Veuillez assigner la tâche à un utilisateur'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'La tâche doit être assignée par un utilisateur'],
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      // Ce champ est optionnel
    },
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt
  }
);

module.exports = mongoose.model('Task', TaskSchema);
