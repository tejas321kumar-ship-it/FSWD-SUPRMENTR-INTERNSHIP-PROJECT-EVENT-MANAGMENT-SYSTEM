const Registration = require('../models/Registration');
const Event = require('../models/Event');

// GET /api/analytics/event/:eventId — event-level analytics
exports.getEventAnalytics = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const registrations = await Registration.find({ event: event._id });

    const statusBreakdown = registrations.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    // Daily registration trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyTrend = await Registration.aggregate([
      { $match: { event: event._id, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Team vs individual breakdown
    const teamCount = registrations.filter(r => r.team).length;

    res.json({
      success: true,
      analytics: {
        totalRegistrations: registrations.length,
        capacity: event.capacity,
        fillRate: Math.round((registrations.length / event.capacity) * 100),
        statusBreakdown,
        dailyTrend: dailyTrend.map(d => ({ date: d._id, count: d.count })),
        teamRegistrations: teamCount,
        individualRegistrations: registrations.length - teamCount,
        checkedIn: statusBreakdown.attended || 0,
        revenue: registrations.length * event.price,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/overview — admin overview
exports.getAdminOverview = async (req, res, next) => {
  try {
    const [totalEvents, totalRegistrations, eventsByCategory, recentEvents] = await Promise.all([
      Event.countDocuments(),
      Registration.countDocuments(),
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Event.find().sort({ createdAt: -1 }).limit(5).select('title category registeredCount capacity startDate'),
    ]);

    // Monthly registration trend
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const monthlyTrend = await Registration.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      overview: {
        totalEvents,
        totalRegistrations,
        eventsByCategory: eventsByCategory.map(c => ({ category: c._id, count: c.count })),
        recentEvents,
        monthlyTrend: monthlyTrend.map(m => ({ month: m._id, count: m.count })),
      },
    });
  } catch (err) {
    next(err);
  }
};
