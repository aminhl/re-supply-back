const mongoose = require('mongoose');

const ScheduleMeetingSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'A ScheduleMeeting must have a title'],
    },
    description: {
      type: String,
      required: [true, 'A ScheduleMeeting must have a description'],
    },
    date: {
      type: Date,
      required: [true, 'A ScheduleMeeting must have a date'],
    },
    status: {
      type: String,
      enum: ['accepted', 'pending', 'rejected'],
      default: 'pending'
    },
},
{ timestamps: true }
);
const ScheduleMeeting = mongoose.model('ScheduleMeeting', ScheduleMeetingSchema);
module.exports = ScheduleMeeting;
