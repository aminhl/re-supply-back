const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');

exports.signup = async (req, res) => {
  const user = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    image: req.body.image,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECURE, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  try {
    res.status(201).json({
      status: 'success',
      token,
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
