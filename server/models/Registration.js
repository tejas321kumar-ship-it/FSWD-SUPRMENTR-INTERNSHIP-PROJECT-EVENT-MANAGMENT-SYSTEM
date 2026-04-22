const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null,
  },
  ticketCode: {
    type: String,
    unique: true,
    required: true,
  },
  qrData: { type: String, default: '' }, // base64 QR image
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'attended', 'waitlisted'],
    default: 'confirmed',
  },
  checkedInAt: { type: Date, default: null },
  certificateUrl: { type: String, default: '' },
}, { timestamps: true });

// Prevent duplicate registration
registrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
