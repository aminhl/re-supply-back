const User = require("./../models/userModel");
const Request = require("./../models/requestModel")
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
  let verified = req.query.verified;
  let role = req.query.role;
  console.log(verified);
  console.log(role);
  let criteria = {};

  if (verified) criteria.verified = verified;
  if (role) criteria.role = role;
  let users = await User.find(criteria);
  res.status(200).json({
    status: "success",
    data: {
      users,
    },
  });
};

exports.getVerifiedUsers = async (req, res) => {
  const verifiedUsers = await User.find({ verified: true });
  res.status(200).json({
    status: "success",
    data: verifiedUsers,
  });
};

exports.getUnverifiedUsers = async (req, res) => {
  const verifiedUsers = await User.find({ verified: false });
  res.status(200).json({
    status: "success",
    data: verifiedUsers,
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

exports.upgradeToAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      role: "admin",
    });
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    return res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.searchChatUsers = async (req, res, next) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { firstName: { $regex: req.query.search, $options: "i" } },
            { lastName: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};
const countryScores = {
  'DZ': 2,
  'AO': 3,
  'BJ': 5,
  'BW': 1,
  'BF': 6,
  'BI': 8,
  'CV': 2,
  'CM': 4,
  'CF': 8,
  'TD': 9,
  'KM': 5,
  'CD': 10,
  'CG': 4,
  'CI': 5,
  'DJ': 6,
  'EG': 2,
  'GQ': 4,
  'ER': 8,
  'ET': 5,
  'GA': 7,
  'GM': 3,
  'GH': 7,
  'GN': 3,
  'GW': 8,
  'KE': 5,
  'LS': 8,
  'LR': 9,
  'LY': 1,
  'MG': 6,
  'MW': 9,
  'ML': 9,
  'MR': 7,
  'MU': 1,
  'MA': 3,
  'MZ': 8,
  'NA': 3,
  'NE': 10,
  'NG': 5,
  'RW': 7,
  'ST': 4,
  'SN': 6,
  'SC': 1,
  'SL': 8,
  'SO': 10,
  'ZA': 4,
  'SS': 9,
  'SD': 7,
  'TZ': 7,
  'TG': 7,
  'TN': 2,
  'UG': 6,
  'ZM': 7,
  'ZW': 8,
};
exports.calculateRequestScores=async (req,res)=> {
  // Get all requests
  try
  {
    const requests = await Request.find();
    const user = await User.findById(req.user.id);
    const scores = [];
    // Loop through requests
    for (const request of requests) {
      let score = 0;
      const requester=await User.findById(request.requester_id);
      const requesterCountry = requester.country;
      if(requester.annualIncome!==-1){
        if(requester.annualIncome===0){
          score=+2;
        }
        if(requester.annualIncome>100){
          score=+1;
        }
      }
      if(requester.verified){
        score=+1;
      }
      if (request.type === 'Item') {
        score +=2;
      } else if (request.type === 'Currency') {
        score += 1;
      }
      if(requesterCountry){
      if(countryScores[requesterCountry] < countryScores[user.country]){
        score=+countryScores[user.country]-countryScores[requesterCountry]
      }
      score=+ countryScores[requesterCountry]
    }
      scores.push({requestId: request._id, score});
    }
    user.scores = scores;
    await user.save();
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
}catch (err) {
    return res.status(408).json({
      status: "fail",
      message: err,
    });}

}
