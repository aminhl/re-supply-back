const { promisify } = require('util')
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res) => {
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
    res.status(201).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err,
    });
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
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
};


exports.protect =async (req, res, next) => {
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
  const message = `Forgot your password ? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.
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

exports.resetPassword = (req, res, next) => {

}