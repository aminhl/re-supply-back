const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'A user must have a first name'],
  },
  lastName: {
    type: String,
    required: [true, 'A user must have a last name'],
  },
  phoneNumber: {
    type: String,
    required: [true, 'A user must have a phone number'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email address'],
    unique: true,
    lowercase: true,
  },
  image: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password'],
  },
  joinedAt: {
    type: Date,
    default: Date.now(),
  },
  /* more props ll be added later   */
});

const User = mongoose.model('User', userSchema);

module.exports = User;
