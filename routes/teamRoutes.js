const express = require('express');
const router = express.Router();
const {
  createTeam,
  getMyTeams,
  getTeamById,
  addMemberToTeam,
  removeMemberFromTeam,
  deleteTeam,
} = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');

// Toutes les routes ci-dessous sont protégées
router.use(protect);

router.route('/').post(createTeam).get(getMyTeams);

router.route('/:id').get(getTeamById).delete(deleteTeam);

router
  .route('/:id/members')
  .post(addMemberToTeam); // POST est plus RESTful pour ajouter à une collection

router.route('/:id/members/:memberId').delete(removeMemberFromTeam);

module.exports = router;
