const router = require('express').Router();
const { getEventAnalytics, getAdminOverview } = require('../controllers/analyticsController');
const { generateCertificate } = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

router.get('/event/:eventId', protect, authorize('organizer', 'admin'), getEventAnalytics);
router.get('/overview', protect, authorize('admin'), getAdminOverview);
router.get('/certificate/:registrationId', protect, generateCertificate);

module.exports = router;
