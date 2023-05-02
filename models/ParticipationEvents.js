const mongoose = require('mongoose');
const ParticipationEventsSchema = new mongoose.Schema({
  eventTitle: {
    type: String,
  },
  eventDescription: {
    type: String,
  },
  eventDate: {
    type: Date,
  },
  Eventusers: {
    type: Array,
  }
});
const ParticipationEvents = mongoose.model('ParticipationEvents', ParticipationEventsSchema);
module.exports = ParticipationEvents;
