const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Veuillez ajouter un nom pour l\'équipe'],
      unique: true,
      trim: true,
      maxlength: [50, 'Le nom de l\'équipe ne peut pas dépasser 50 caractères'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'La description ne peut pas dépasser 200 caractères'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Vous pouvez ajouter d'autres champs, comme le chef d'équipe
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Assurer que le leader est toujours un membre de l'équipe
TeamSchema.pre('save', function (next) {
  // Si la liste des membres est modifiée, on s'assure que le leader en fait partie.
  if (this.isModified('members') && !this.members.includes(this.leader)) {
    this.members.push(this.leader);
  }
  next();
});

module.exports = mongoose.model('Team', TeamSchema);
