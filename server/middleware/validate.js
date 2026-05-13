const { body, param, validationResult } = require('express-validator');

// Middleware that checks for validation errors and returns 400 if any
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });
  }
  next();
};

// Allowed email domains for registration
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.in', 'yahoo.co.in',
  'outlook.com', 'hotmail.com', 'live.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'zoho.com', 'zoho.in',
  'aol.com', 'mail.com', 'gmx.com',
  'rediffmail.com', 'yandex.com',
];

// Custom email quality validator
const strictEmailCheck = (value) => {
  const [local, domain] = value.toLowerCase().split('@');
  if (!/[a-zA-Z]/.test(local)) throw new Error('Email must contain letters, not just numbers');
  if (local.length < 3) throw new Error('Email username is too short');
  const isAllowed = ALLOWED_EMAIL_DOMAINS.includes(domain);
  const isOrgOrEdu = /\.(edu|edu\.in|ac\.in|org|gov|gov\.in)$/i.test(domain);
  if (!isAllowed && !isOrgOrEdu) throw new Error('Email domain not supported. Use Gmail, Outlook, Yahoo, etc.');
  return true;
};

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }).withMessage('Name max 60 chars'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail().custom(strictEmailCheck),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'organizer']).withMessage('Role must be user or organizer'),
  body('phone').optional().trim(),
  handleValidationErrors,
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail().custom(strictEmailCheck),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const validateProfileUpdate = [
  body('name').optional().trim().isLength({ max: 60 }).withMessage('Name max 60 chars'),
  body('phone').optional().trim(),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  handleValidationErrors,
];

// --- Event validations ---

const validateCreateEvent = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }).withMessage('Title max 120 chars'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }).withMessage('Description max 2000 chars'),
  body('category').optional().isIn(['conference', 'workshop', 'seminar', 'hackathon', 'meetup', 'webinar', 'other']).withMessage('Invalid category'),
  body('venue.name').trim().notEmpty().withMessage('Venue name is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('allowTeams').optional().isBoolean(),
  body('maxTeamSize').optional().isInt({ min: 2 }).withMessage('Max team size must be at least 2'),
  body('status').optional().isIn(['draft', 'published', 'cancelled', 'completed']).withMessage('Invalid status'),
  handleValidationErrors,
];

const validateUpdateEvent = [
  body('title').optional().trim().isLength({ max: 120 }).withMessage('Title max 120 chars'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description max 2000 chars'),
  body('category').optional().isIn(['conference', 'workshop', 'seminar', 'hackathon', 'meetup', 'webinar', 'other']).withMessage('Invalid category'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('status').optional().isIn(['draft', 'published', 'cancelled', 'completed']).withMessage('Invalid status'),
  handleValidationErrors,
];

// --- Registration validations ---

const validateTeamName = [
  body('teamName').trim().notEmpty().withMessage('Team name is required').isLength({ max: 80 }).withMessage('Team name max 80 chars'),
  handleValidationErrors,
];

const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID'),
  handleValidationErrors,
];

const validateEventId = [
  param('eventId').isMongoId().withMessage('Invalid event ID'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateCreateEvent,
  validateUpdateEvent,
  validateTeamName,
  validateObjectId,
  validateEventId,
};
