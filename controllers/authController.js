const { promisify } = require('util')
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24*60*60*1000),
    httpOnly: true
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  // Remove password from the output
  user.password = undefined;
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
}

exports.signup = async (req, res, next) => {
  const user = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    image: req.body.image,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt
  });
  try {
    createSendToken(user, 200, res);
  } catch (err) {
    return next(new AppError(err, 500))
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if email & password exist
  if (!email || !password)
    return next(new AppError(`Please provide an email and password`, 500));
  // 2) Check if user exists & password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError(`Incorrect email or password`, 500));
  // 3) If everything is OK, send token to the client
  createSendToken(user, 200, res)
};


exports.protect = async (req, res, next) => {
  // 1) Getting token & check of it there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
    token = req.headers.authorization.split(' ')[1];
  if (!token) return next(new AppError(`You are not logged in! Please login to get access`, 401));
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if(!freshUser) return next(new AppError(`The user belonging to this token does no longer exist`))
  // 4) Check if user changed password after the token was issued
  if(freshUser.changedPasswordAfter(decoded.iat)) return next(new AppError(`User recently changed password! Please login again`));
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  next();
}

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if(!roles.includes(req.user.role))
      return next(new AppError(`You don't have permission to perform this action`, 403));
    next();
  }
}

exports.forgotPassword = async (req, res, next) => {
  // 1) Get User based on POSTed email
  const user = await User.findOne({email: req.body.email})
  if(!user) return next(new AppError(`There's no user with such email address`, 404));
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false});
  // 3) Send it to user's email address
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password ? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}
  If you didn't forgot your password, please ignore this email!`;
  try{
    await sendEmail({
      email: user.email,
      subject: `Your password reset token (valid for 10 min)`,
      message
    })
    res.status(200).json({
      status: 'success',
      message: 'token sent to email!'
    })
  }catch(err){
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(`There was an error sending the email. Try again later!`, 500))
  }
}

exports.resetPassword = async (req, res, next) => {
  // 1) Get the user based on the token
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  // 2) If the token has not expired, and there's a user, set the new password
  if(!user) return next(new AppError(`Token is invalid or has expired `, 400));
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token
  })
}


//implement Passport Google OAuth

passport.use(
    new GoogleStrategy(
        {
          // options for the Google strategy
          callbackURL: process.env.CALLBACK_URL,
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // check if user already exists in our database
            let user = await User.findOne({ email: profile.emails[0].value });
            if (!user) {
              // create new user
              user = await User.create({
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: profile.emails[0].value,
                image: profile.photos[0].value,
              });
            }
            // return user object
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
    )
);

// authenticate with google
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// callback route for google to redirect to
exports.googleAuthRedirect = passport.authenticate('google', {
  failureRedirect: '/login',
  session: false
});

// handle user after authentication
exports.handleGoogleAuth = (req, res) => {
  createSendToken(req.user, 200, res);
};

// login with google
exports.googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// callback route for google to redirect to after authentication
exports.googleLoginCallback = passport.authenticate('google', {
  failureRedirect: '/login',
  session: false
}), (req, res) => {
  // create and send a token to the client
  const token = generateToken(req.user);
  res.status(200).json({ status: 'success', token });
};

exports.updatePassword = async (req, res, next) => {
 // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
 if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
   return next(new AppError('Your current password is wrong.', 401));
 }
 // 3) If so, update password
 user.password = req.body.password;
 user.confirmPassword = req.body.confirmPassword;
 await user.save();

 // 4) Log user in, send JWT
 createSendToken(user, 200, res);
}

