const router = require('express').Router();
const {
  createEvent, getEvents, getEvent,
  updateEvent, deleteEvent, getMyEvents,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');
const { validateCreateEvent, validateUpdateEvent, validateObjectId } = require('../middleware/validate');

router.get('/', getEvents);
router.get('/my/events', protect, authorize('organizer', 'admin'), getMyEvents);
router.get('/:id', validateObjectId, getEvent);
router.post('/', protect, authorize('organizer', 'admin'), validateCreateEvent, createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), validateObjectId, validateUpdateEvent, updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), validateObjectId, deleteEvent);

module.exports = router;
