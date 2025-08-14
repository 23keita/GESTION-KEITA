const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Charger les modèles
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');

// Connexion à la DB
mongoose.connect(process.env.MONGO_URI);

// Lire les fichiers JSON
const users = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'users.json'), 'utf-8')
);
const tasks = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tasks.json'), 'utf-8')
);
const teams = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'teams.json'), 'utf-8')
);

// Importer les données dans la DB
const importData = async () => {
  try {
    // D'abord, nettoyer la base de données
    await Task.deleteMany();
    await Team.deleteMany();
    await User.deleteMany();
    console.log('🗑️  Anciennes données supprimées...');

    // Importer les utilisateurs
    const createdUsers = await User.create(users);
    console.log('✅ Utilisateurs importés...');

    // Préparer les équipes en remplaçant les emails par des ObjectIds
    const teamsToCreate = teams.map(teamData => {
        const leaderUser = createdUsers.find(u => u.email === teamData.leader);
        if (!leaderUser) {
            console.warn(`⚠️  Leader "${teamData.leader}" non trouvé pour l'équipe "${teamData.name}". Équipe ignorée.`);
            return null;
        }

        const memberIds = teamData.members.map(memberEmail => {
            const memberUser = createdUsers.find(u => u.email === memberEmail);
            if (!memberUser) {
                console.warn(`⚠️  Membre "${memberEmail}" non trouvé pour l'équipe "${teamData.name}". Membre ignoré.`);
                return null;
            }
            return memberUser._id;
        }).filter(id => id !== null);

        return {
            ...teamData,
            leader: leaderUser._id,
            members: memberIds,
        };
    }).filter(team => team !== null);
    const createdTeams = await Team.create(teamsToCreate);
    console.log('✅ Équipes importées...');

    // Préparer les tâches en remplaçant les identifiants textuels par des ObjectIds
    const tasksToCreate = tasks.map(task => {
      const assignedToUser = createdUsers.find(u => u.email === task.assignedTo);
      const assignedByUser = createdUsers.find(u => u.email === task.assignedBy);
      const team = createdTeams.find(t => t.name === task.team);

      if (!assignedToUser || !assignedByUser) {
        console.warn(`⚠️  Utilisateur non trouvé pour la tâche "${task.title}". Tâche ignorée.`);
        return null;
      }

      return {
        ...task,
        assignedTo: assignedToUser._id,
        assignedBy: assignedByUser._id,
        team: team ? team._id : undefined, // Le champ team est optionnel
      };
    }).filter(task => task !== null); // Filtrer les tâches pour lesquelles des utilisateurs n'ont pas été trouvés

    await Task.create(tasksToCreate);
    console.log('✅ Tâches importées...');

    console.log('\n🎉 Toutes les données de test ont été importées avec succès !');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Supprimer les données de la DB
const deleteData = async () => {
  try {
    await Task.deleteMany();
    await Team.deleteMany();
    await User.deleteMany();
    console.log('🗑️ Toutes les données ont été supprimées avec succès...');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Gérer les arguments de la ligne de commande
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Veuillez utiliser les options -i (importer) ou -d (supprimer)');
  process.exit(1);
}