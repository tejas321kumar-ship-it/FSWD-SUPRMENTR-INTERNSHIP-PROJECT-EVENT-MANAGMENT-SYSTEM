const router = require('express').Router();
const {
  registerForEvent, createTeamRegistration, joinTeam,
  getMyRegistrations, getEventRegistrations,
  checkIn, cancelRegistration, verifyTicket,
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/auth');
const { validateEventId, validateObjectId, validateTeamName } = require('../middleware/validate');

// PUBLIC — QR code verification (no auth required)
router.get('/verify/:ticketCode', verifyTicket);

// All registration routes below require auth
router.use(protect);

router.post('/:eventId', validateEventId, registerForEvent);
router.post('/:eventId/team', validateEventId, validateTeamName, createTeamRegistration);
router.post('/team/join/:inviteCode', joinTeam);
router.get('/my', getMyRegistrations);
router.get('/event/:eventId', validateEventId, authorize('organizer', 'admin'), getEventRegistrations);
router.put('/:id/checkin', validateObjectId, authorize('organizer', 'admin'), checkIn);
router.delete('/:id', validateObjectId, cancelRegistration);

module.exports = router;
