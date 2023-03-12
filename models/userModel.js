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
    default: "none"
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'A user must have an email address'],
    validate: {
      validator: function (v) {
        if (this.provider === 'facebook' && !v) {
          return false;
        }
        return validator.isEmail(v);
      },
      message: 'Please provide a valid email address',
    },
  },
  images: [String],
  password: {
    type: String,
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    validate: {
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
  },
  facebookId: {
    type: String,
    index: { unique: true, sparse: true },
  },
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
