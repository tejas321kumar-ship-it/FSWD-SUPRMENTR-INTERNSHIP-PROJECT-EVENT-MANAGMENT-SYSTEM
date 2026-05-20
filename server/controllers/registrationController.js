const crypto = require('crypto');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team');
const QRCode = require('qrcode');


const generateTicketCode = () =>
  `EVH-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const generateInviteCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase();

// Build a verification URL that, when scanned, opens a clean public ticket page.
// Smartphone cameras (iOS/Android) auto-detect the URL and prompt to open it.
const buildTicketUrl = (ticketCode) => {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/ticket/${ticketCode}`;
};

const generateQR = (ticketCode) =>
  QRCode.toDataURL(buildTicketUrl(ticketCode), {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
    color: { dark: '#0B0B0B', light: '#FFFFFF' },
  });

// POST /api/registrations/:eventId — register for an event
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Event is not open for registration' });
    }

    // Check duplicate (active registrations only)
    const existing = await Registration.findOne({
      event: event._id, user: req.user._id, status: { $ne: 'cancelled' },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already registered for this event' });
    }

    // Atomic capacity check + increment
    const updated = await Event.findOneAndUpdate(
      { _id: event._id, $expr: { $lt: ['$registeredCount', '$capacity'] } },
      { $inc: { registeredCount: 1 } },
      { new: true },
    );
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    const ticketCode = generateTicketCode();
    const qrData = await generateQR(ticketCode);

    const registration = await Registration.create({
      event: event._id,
      user: req.user._id,
      ticketCode,
      qrData,
    });

    res.status(201).json({ success: true, registration });
  } catch (err) {
    next(err);
  }
};

// POST /api/registrations/:eventId/team — create team + register leader
exports.createTeamRegistration = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.allowTeams) {
      return res.status(400).json({ success: false, message: 'This event does not allow team registration' });
    }
    const { teamName } = req.body;
    if (!teamName) return res.status(400).json({ success: false, message: 'Team name is required' });

    // Atomic capacity check + increment
    const updated = await Event.findOneAndUpdate(
      { _id: event._id, $expr: { $lt: ['$registeredCount', '$capacity'] } },
      { $inc: { registeredCount: 1 } },
      { new: true },
    );
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    const inviteCode = generateInviteCode();
    const team = await Team.create({
      name: teamName,
      event: event._id,
      leader: req.user._id,
      members: [{ user: req.user._id, name: req.user.name, email: req.user.email }],
      inviteCode,
    });

    // Register the leader
    const ticketCode = generateTicketCode();
    const qrData = await generateQR(ticketCode);

    const registration = await Registration.create({
      event: event._id,
      user: req.user._id,
      team: team._id,
      ticketCode,
      qrData,
    });

    res.status(201).json({ success: true, team, registration });
  } catch (err) {
    next(err);
  }
};

// POST /api/registrations/team/join/:inviteCode — join a team
exports.joinTeam = async (req, res, next) => {
  try {
    const team = await Team.findOne({ inviteCode: req.params.inviteCode });
    if (!team) return res.status(404).json({ success: false, message: 'Invalid invite code' });

    const event = await Event.findById(team.event);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (team.members.length >= event.maxTeamSize) {
      return res.status(400).json({ success: false, message: 'Team is full' });
    }
    // Check if already in team
    const alreadyMember = team.members.some(m => m.user?.toString() === req.user._id.toString());
    if (alreadyMember) {
      return res.status(409).json({ success: false, message: 'Already in this team' });
    }

    // Atomic capacity check + increment
    const updated = await Event.findOneAndUpdate(
      { _id: event._id, $expr: { $lt: ['$registeredCount', '$capacity'] } },
      { $inc: { registeredCount: 1 } },
      { new: true },
    );
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    team.members.push({ user: req.user._id, name: req.user.name, email: req.user.email });
    if (team.members.length >= event.maxTeamSize) team.isFull = true;
    await team.save();

    const ticketCode = generateTicketCode();
    const qrData = await generateQR(ticketCode);

    const registration = await Registration.create({
      event: event._id,
      user: req.user._id,
      team: team._id,
      ticketCode,
      qrData,
    });

    res.status(201).json({ success: true, team, registration });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/my — user's registrations
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate('event', 'title startDate endDate venue status coverImage')
      .populate('team', 'name inviteCode')
      .sort({ createdAt: -1 });
    res.json({ success: true, registrations });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/event/:eventId — organizer views event registrations
exports.getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Only organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const registrations = await Registration.find({ event: event._id })
      .populate('user', 'name email phone')
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, registrations, total: registrations.length });
  } catch (err) {
    next(err);
  }
};

// PUT /api/registrations/:id/checkin — mark attendee as checked in
exports.checkIn = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (registration.status === 'attended') {
      return res.status(400).json({ success: false, message: 'Already checked in' });
    }
    if (registration.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot check in a cancelled registration' });
    }

    // Verify the requesting user is the event organizer or admin
    const event = await Event.findById(registration.event);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to check in attendees for this event' });
    }

    registration.status = 'attended';
    registration.checkedInAt = new Date();
    await registration.save();

    res.json({ success: true, registration });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/verify/:ticketCode — PUBLIC endpoint to view ticket info via QR
exports.verifyTicket = async (req, res, next) => {
  try {
    const { ticketCode } = req.params;
    if (!ticketCode || !/^EVH-[A-Z0-9-]+$/.test(ticketCode)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket code' });
    }

    const registration = await Registration.findOne({ ticketCode })
      .populate('user', 'name')
      .populate('event', 'title description startDate endDate venue category coverImage')
      .populate('team', 'name');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Return only public, safe fields (no email, phone, IDs, etc.)
    res.json({
      success: true,
      ticket: {
        ticketCode: registration.ticketCode,
        status: registration.status,
        registeredAt: registration.createdAt,
        checkedInAt: registration.checkedInAt,
        attendee: {
          name: registration.user?.name || 'Unknown',
        },
        event: registration.event ? {
          title: registration.event.title,
          description: registration.event.description,
          startDate: registration.event.startDate,
          endDate: registration.event.endDate,
          venue: registration.event.venue,
          category: registration.event.category,
          coverImage: registration.event.coverImage,
        } : null,
        team: registration.team ? { name: registration.team.name } : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/registrations/:id — cancel registration
exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    if (registration.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Registration already cancelled' });
    }

    registration.status = 'cancelled';
    await registration.save();

    // Decrement event count (only for first cancellation)
    await Event.findByIdAndUpdate(registration.event, { $inc: { registeredCount: -1 } });

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (err) {
    next(err);
  }
};
