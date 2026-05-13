const Event = require('../models/Event');

const ALLOWED_EVENT_FIELDS = [
  'title', 'description', 'category', 'venue', 'startDate', 'endDate',
  'capacity', 'price', 'tags', 'coverImage', 'status', 'allowTeams', 'maxTeamSize',
];

const pickFields = (body, fields) => {
  const obj = {};
  fields.forEach(f => { if (body[f] !== undefined) obj[f] = body[f]; });
  return obj;
};

// POST /api/events — organizer creates event
exports.createEvent = async (req, res, next) => {
  try {
    const data = pickFields(req.body, ALLOWED_EVENT_FIELDS);
    data.organizer = req.user._id;
    const event = await Event.create(data);
    res.status(201).json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// GET /api/events — public listing with filters
exports.getEvents = async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = 'published'; // default to published
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'name email')
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter),
    ]);

    res.json({
      success: true,
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/:id
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email avatar');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// PUT /api/events/:id — organizer updates own event
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Only the organizer or admin can update
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
    }

    const data = pickFields(req.body, ALLOWED_EVENT_FIELDS);
    event = await Event.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/my/events — organizer's own events
exports.getMyEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
};
