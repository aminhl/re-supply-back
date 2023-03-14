const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('./../utils/email');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');


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
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

// Create the multer upload object
const upload = multer({ storage: storage });

//update User
exports.updateUser = [
    // Use multer middleware to handle the form data
    upload.array('images', 2),
    async (req, res, next) => {
        try {
            // Find the user to update by ID
            const user = await User.findById(req.params.id);

            if (!user) {
                return next(new AppError('User not found', 404));
            }

            // Update the user with the new data
            if (req.body.firstName) user.firstName = req.body.firstName;
            if (req.body.lastName) user.lastName = req.body.lastName;
            if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
            if (req.files && req.files.length > 0) {
                user.images = req.files.map(
                    (file) => `/uploads/users/${file.filename}`
                );
            }

            // Check if email was changed
            if (req.body.email && req.body.email !== user.email) {
                // Check if email already exists
                const existingUser = await User.findOne({ email: req.body.email });
                if (existingUser) {
                    return next(new AppError('This email is already taken.', 400));
                }

                // Create a random token
                const token = crypto.randomBytes(32).toString('hex');

                // Create a verification URL with the token
                const verificationURL = `${req.protocol}://${req.get(
                    'host'
                )}/api/v1/users/verifyEmail/${token}`;

                // Save the new email and the token to the user document
                user.email = req.body.email;
                user.emailVerificationToken = token;
                user.emailVerificationExpires =
                    Date.now() + 24 * 60 * 60 * 1000; // Token expires in 24 hours
                user.verified = false;
                // Send verification email
                await sendEmail({
                    email: user.email,
                    subject: 'Please confirm your email',
                    message: `Please click the following link to confirm your email: ${verificationURL}`,
                });
            }

            // Delete the first image from the server if it exists
            if (user.images.length > 1 && user.images[0] !== '') {
                const imagePath = path.join(
                    __dirname,
                    '..',
                    'public',
                    user.images[0]
                );
                await fs.unlink(imagePath);
            }

            // Save the updated user to the database
            await user.save();

            res.status(200).json({
                status: 'success',
                data: {
                    user,
                },
            });
        } catch (err) {
            return next(err);
        }
    },
];
