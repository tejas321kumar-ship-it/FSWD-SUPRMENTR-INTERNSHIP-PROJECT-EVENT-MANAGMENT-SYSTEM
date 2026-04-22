const router = require('express').Router();
const {
  createEvent, getEvents, getEvent,
  updateEvent, deleteEvent, getMyEvents,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getEvents);
router.get('/my/events', protect, authorize('organizer', 'admin'), getMyEvents);
router.get('/:id', getEvent);
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

module.exports = router;
