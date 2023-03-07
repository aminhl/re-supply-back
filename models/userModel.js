const mongoose = require('mongoose');
const validator = require('validator').default;
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    validate: [validator.isEmail, 'Please provide a valid email address'],
  },
  image: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE & SAVE!!!
      validator: function (previousPassword) {
        return previousPassword === this.password;
      },
    },
  },
  role: {
    type: String,
    enum: ["admin", "member"],
    default: "member"
  },
  joinedAt: {
    type: Date,
    default: Date.now(),
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active:{
    type: Boolean,
    default: true,
    select: false
  }
  /* more props ll be added later   */
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if(!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
})

userSchema.pre(/^find/, function(next){
  // This points to the current query
  this.find({ active: { $ne: false }});
  next();
})

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
  if(this.passwordChangedAt) return JWTTimestamp < parseInt(this.passwordChangedAt/1000, 10)
  return false;
}

userSchema.methods.createPasswordResetToken = function(){
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10*60*1000;
  return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
