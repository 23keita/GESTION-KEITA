const asyncHandler = require('express-async-handler');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Créer une nouvelle équipe
// @route   POST /api/teams
// @access  Private
const createTeam = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Veuillez fournir un nom pour l'équipe");
  }

  // Le créateur de l'équipe est le leader et le premier membre.
  const team = await Team.create({
    name,
    description,
    leader: req.user._id,
    members: [req.user._id], // Le leader est automatiquement membre
  });

  res.status(201).json(team);
});

// @desc    Obtenir toutes les équipes où l'utilisateur est membre
// @route   GET /api/teams
// @access  Private
const getMyTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({ members: req.user._id })
    .populate('leader', 'username email')
    .populate('members', 'username email');
  res.status(200).json(teams);
});

// @desc    Obtenir les détails d'une équipe
// @route   GET /api/teams/:id
// @access  Private (membre de l'équipe)
const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('leader', 'username email')
    .populate('members', 'username email');

  if (!team) {
    res.status(404);
    throw new Error('Équipe non trouvée');
  }

  // Vérifier si l'utilisateur est membre de l'équipe pour pouvoir la voir
  const isMember = team.members.some((member) =>
    member._id.equals(req.user._id)
  );
  if (!isMember && req.user.role !== 'admin') {
    res.status(403);
    throw new Error("Accès non autorisé. Vous n'êtes pas membre de cette équipe.");
  }

  res.status(200).json(team);
});

// @desc    Ajouter un membre à une équipe
// @route   POST /api/teams/:id/members
// @access  Private (Leader de l'équipe)
const addMemberToTeam = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const team = await Team.findById(req.params.id);

  if (!team) {
    res.status(404);
    throw new Error('Équipe non trouvée');
  }

  // Seul le leader de l'équipe peut ajouter des membres
  if (team.leader.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error(
      "Action non autorisée. Seul le leader de l'équipe peut ajouter des membres."
    );
  }

  const userToAdd = await User.findById(userId);
  if (!userToAdd) {
    res.status(404);
    throw new Error('Utilisateur à ajouter non trouvé.');
  }

  // Vérifier si le membre est déjà dans l'équipe
  if (team.members.includes(userId)) {
    res.status(400);
    throw new Error("Cet utilisateur est déjà membre de l'équipe");
  }

  team.members.push(userId);
  await team.save();

  const updatedTeam = await Team.findById(req.params.id)
    .populate('leader', 'username email')
    .populate('members', 'username email');

  res.status(200).json(updatedTeam);
});

// @desc    Retirer un membre d'une équipe
// @route   DELETE /api/teams/:id/members/:memberId
// @access  Private (Leader de l'équipe)
const removeMemberFromTeam = asyncHandler(async (req, res) => {
  const { id: teamId, memberId } = req.params;
  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error('Équipe non trouvée');
  }

  // Seul le leader peut retirer des membres
  if (team.leader.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error(
      "Action non autorisée. Seul le leader de l'équipe peut retirer des membres."
    );
  }

  // Le leader ne peut pas se retirer lui-même
  if (team.leader.toString() === memberId) {
    res.status(400);
    throw new Error("Le leader ne peut pas être retiré de l'équipe.");
  }

  team.members.pull(memberId);
  await team.save();

  const updatedTeam = await Team.findById(teamId)
    .populate('leader', 'username email')
    .populate('members', 'username email');

  res.status(200).json(updatedTeam);
});

// @desc    Supprimer une équipe
// @route   DELETE /api/teams/:id
// @access  Private (Leader de l'équipe)
const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    res.status(404);
    throw new Error('Équipe non trouvée');
  }

  // Seul le leader de l'équipe peut la supprimer
  if (team.leader.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error(
      "Action non autorisée. Seul le leader de l'équipe peut la supprimer."
    );
  }

  // Note : Pour une application plus complète, vous pourriez vouloir
  // supprimer ou réassigner toutes les tâches associées à cette équipe.
  // await Task.deleteMany({ team: team._id });

  await team.deleteOne();

  res.status(200).json({ id: req.params.id, message: 'Équipe supprimée avec succès' });
});

module.exports = {
  createTeam,
  getMyTeams,
  getTeamById,
  addMemberToTeam,
  removeMemberFromTeam,
  deleteTeam,
};
