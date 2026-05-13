const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: 120,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 2000,
  },
  category: {
    type: String,
    enum: ['conference', 'workshop', 'seminar', 'hackathon', 'meetup', 'webinar', 'other'],
    default: 'other',
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  venue: {
    name: { type: String, required: true },
    address: String,
    city: String,
    isOnline: { type: Boolean, default: false },
    meetingLink: String,
  },
  startDate: { type: Date, required: [true, 'Start date is required'] },
  endDate: { type: Date, required: [true, 'End date is required'] },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1,
  },
  registeredCount: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  tags: [{ type: String, trim: true }],
  coverImage: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft',
  },
  allowTeams: { type: Boolean, default: false },
  maxTeamSize: { type: Number, default: 5 },
}, { timestamps: true });

// Virtual: check if event is full
eventSchema.virtual('isFull').get(function () {
  return this.registeredCount >= this.capacity;
});

// Ensure virtuals show in JSON
eventSchema.set('toJSON', { virtuals: true });

// Indexes for common queries
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ organizer: 1, createdAt: -1 });
eventSchema.index({ category: 1 });

module.exports = mongoose.model('Event', eventSchema);
