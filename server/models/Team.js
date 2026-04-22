const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: 80,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: String,
    name: String,
    joinedAt: { type: Date, default: Date.now },
  }],
  inviteCode: {
    type: String,
    unique: true,
    required: true,
  },
  isFull: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
