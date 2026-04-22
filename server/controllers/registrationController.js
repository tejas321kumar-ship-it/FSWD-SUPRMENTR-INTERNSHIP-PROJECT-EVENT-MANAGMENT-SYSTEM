const crypto = require('crypto');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team');
const QRCode = require('qrcode');

const generateTicketCode = () =>
  `EVH-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const generateInviteCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase();

// POST /api/registrations/:eventId — register for an event
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Event is not open for registration' });
    }

    // Check capacity
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    // Check duplicate
    const existing = await Registration.findOne({ event: event._id, user: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already registered for this event' });
    }

    const ticketCode = generateTicketCode();
    const qrData = await QRCode.toDataURL(JSON.stringify({
      ticket: ticketCode,
      event: event.title,
      user: req.user.name,
      date: event.startDate,
    }));

    const registration = await Registration.create({
      event: event._id,
      user: req.user._id,
      ticketCode,
      qrData,
    });

    // Increment registered count
    event.registeredCount += 1;
    await event.save();

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
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    const { teamName } = req.body;
    if (!teamName) return res.status(400).json({ success: false, message: 'Team name is required' });

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
    const qrData = await QRCode.toDataURL(JSON.stringify({
      ticket: ticketCode,
      event: event.title,
      team: teamName,
      user: req.user.name,
    }));

    const registration = await Registration.create({
      event: event._id,
      user: req.user._id,
      team: team._id,
      ticketCode,
      qrData,
    });

    event.registeredCount += 1;
    await event.save();

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
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    // Check if already in team
    const alreadyMember = team.members.some(m => m.user?.toString() === req.user._id.toString());
    if (alreadyMember) {
      return res.status(409).json({ success: false, message: 'Already in this team' });
    }

    team.members.push({ user: req.user._id, name: req.user.name, email: req.user.email });
    if (team.members.length >= event.maxTeamSize) team.isFull = true;
    await team.save();

    const ticketCode = generateTicketCode();
    const qrData = await QRCode.toDataURL(JSON.stringify({
      ticket: ticketCode,
      event: event.title,
      team: team.name,
      user: req.user.name,
    }));

    const registration = await Registration.create({
      event: event._id,
      user: req.user._id,
      team: team._id,
      ticketCode,
      qrData,
    });

    event.registeredCount += 1;
    await event.save();

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

    registration.status = 'attended';
    registration.checkedInAt = new Date();
    await registration.save();

    res.json({ success: true, registration });
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

    registration.status = 'cancelled';
    await registration.save();

    // Decrement event count
    await Event.findByIdAndUpdate(registration.event, { $inc: { registeredCount: -1 } });

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (err) {
    next(err);
  }
};
