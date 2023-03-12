const User = require('./../models/userModel');
const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  })
  return newObj;
}

exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
};

exports.updateProfile = async (req, res, next) => {
  // 1) Create error if user POSTed password
  if(req.body.password || req.body.confirmPassword)
    return next(new AppError(`This route is not for password update. Please use /updatePassword`, 400))
  // 2) Update user document

 const filtredBody = filterObj(req.body, "firstName", "lastName", "phoneNumber", "email", "images")
  console.log(filtredBody);
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filtredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
}

exports.deactivateAccount = async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null
    })
}