const router = require('express').Router();
const {
  registerForEvent, createTeamRegistration, joinTeam,
  getMyRegistrations, getEventRegistrations,
  checkIn, cancelRegistration,
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/auth');

// All registration routes require auth
router.use(protect);

router.post('/:eventId', registerForEvent);
router.post('/:eventId/team', createTeamRegistration);
router.post('/team/join/:inviteCode', joinTeam);
router.get('/my', getMyRegistrations);
router.get('/event/:eventId', authorize('organizer', 'admin'), getEventRegistrations);
router.put('/:id/checkin', authorize('organizer', 'admin'), checkIn);
router.delete('/:id', cancelRegistration);

module.exports = router;
