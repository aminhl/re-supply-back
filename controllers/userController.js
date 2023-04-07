const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("./../utils/email");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    data: {
      users,
    },
  });
};

exports.updateProfile = async (req, res, next) => {
  // 1) Create error if user POSTed password
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError(
        `This route is not for password update. Please use /updatePassword`,
        400
      )
    );
  // 2) Update user document

  const filtredBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "phoneNumber",
    "email",
    "images"
  );
  console.log(filtredBody);
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filtredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
};

exports.deactivateAccount = async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

// Create the multer upload object
const upload = multer({ storage: storage });

//update User

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.checkEmailVerification = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const isEmailVerified = user.verified;

    res.status(200).json({
      status: "success",
      verified: isEmailVerified,
    });
  } catch (err) {
    return next(new AppError("Could not check email verification status", 500));
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: "success",
    });
  } catch (err) {
    return res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
