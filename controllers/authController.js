const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const client = require("twilio")(
  process.env.ACCOUNT_SID,
  process.env.AUTH_TOKEN
);
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const serviceAccount = require("../firebase/resupply-379921-2f0e7acb17e7.json");
const cw = require("crypto-wallets");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
const bucket = admin.storage().bucket();

// Create the multer upload object
const upload = multer();
const signToken = (
  id,
  role,
  firstName,
  lastName,
  email,
  stripeAccountId,
  stripeCustomerId,
  walletEth
) => {
  return jwt.sign(
    {
      id: id,
      role: role,
      firstName: firstName,
      lastName: lastName,
      email: email,
      stripeAccountId: stripeAccountId,
      stripeCustomerId: stripeCustomerId,
      walletEth: walletEth,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(
    user._id,
    user.role,
    user.firstName,
    user.lastName,
    user.email,
    user.stripeAccountId,
    user.stripeCustomerId,
    user.walletEth
  );
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  // Remove password from the output
  user.password = undefined;

  res.status(201).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
exports.signup = [
  // Use multer middleware to handle the form data
  upload.array("images", 2),
  async (req, res, next) => {
    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      password,
      country,
      confirmPassword,
      annualIncome,
    } = req.body;
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError("This email is already taken.", 400));
    }
    // Create a random token
    const token = crypto.randomBytes(32).toString("hex");
    const verificationURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/verifyEmail/${token}`;
    const verificationURLAng = "http://localhost:4200/verifyEmail?id=" + token;
    // Upload images to Firebase Cloud Storage
    const imageUrls = [];
    if (req.files) {
      for (const file of req.files) {
        const extension = path.extname(file.originalname);
        const filename = `${uuidv4()}${extension}`;
        const fileRef = bucket.file(`users/${filename}`);
        const stream = fileRef.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });
        stream.on("error", (err) => {
          console.log("Error uploading image: ", err);
        });
        stream.on("finish", async () => {
          const FireBaseToken = uuidv4();
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/users%2F${filename}?alt=media&token=${FireBaseToken}`;
          const imageUrlWithToken = await bucket
            .file(`users/${filename}`)
            .getSignedUrl({
              action: "read",
              expires: "03-17-2024",
              virtualHostedStyle: true,
              query: {
                alt: "media",
                token: FireBaseToken,
              },
            });
          imageUrls.push(imageUrlWithToken[0]);
          if (imageUrls.length === req.files.length) {
            const user = await User.create({
              firstName,
              lastName,
              phoneNumber,
              email,
              images: imageUrls,
              password,
              country,
              confirmPassword,
              annualIncome,
              passwordChangedAt: req.body.passwordChangedAt,
              emailVerificationToken: token,
              emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // Token expires in 24 hours
            });
            // Create the Stripe account and customer using the user's email
            const account = await stripe.accounts.create({
              type: "standard",
              country: "FR",
              email: user.email,
            });

            const customer = await stripe.customers.create({
              email: user.email,
              name: `${firstName} ${lastName}`,
              description: `Customer for ${user.email}`,
            });
            // Save the Stripe account and customer IDs to the user document
            user.stripeAccountId = account.id;
            user.stripeCustomerId = customer.id;
            user.walletEth = cw.generateWallet("ETH");
            await user.save();
            try {
              // Send verification email
              await sendEmail({
                email: user.email,
                subject: "Please confirm your email",
                message: `Please click the following link to confirm your email: ${verificationURLAng}`,
              });
              createSendToken(user, 201, res);
            } catch (err) {
              // If there's an error while sending email, delete the user
              await user.remove();
              return next(
                new AppError(
                  "There was an error sending the email. Please try again later.",
                  500
                )
              );
            }
          }
        });
        stream.end(file.buffer);
      }
    } else {
      const user = await User.create({
        firstName,
        lastName,
        phoneNumber,
        email,
        images: [],
        password,
        country,
        confirmPassword,
        annualIncome,
        passwordChangedAt: req.body.passwordChangedAt,
        emailVerificationToken: token,
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // Token expires in 24 hours
        stripeAccountId: account.id,
        stripeCustomerId: customer.id,
      });

      try {
        // Send verification email
        await sendEmail({
          email: user.email,
          subject: "Please confirm your email",
          message: `Please click the following link to confirm your email: ${verificationURLAng}`,
        });

        createSendToken(user, 201, res);
      } catch (err) {
        // If there's an error while sending email, delete the user
        await user.remove();

        return next(
          new AppError(
            "There was an error sending the email. Please try again later.",
            500
          )
        );
      }
    }
  },
];

exports.verifyEmail = async (req, res, next) => {
  const { token } = req.params;
  // Find the user with the given token and check if the token is still valid
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("Invalid or expired token.", 400));
  }
  // Mark the user's email as verified and remove the verification token
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  user.verified = true;
  await user.save({ validateBeforeSave: false });
  res.redirect("http://localhost:4200/verifyEmail");
};
// function to verify user  password
const verifyUserPasswordAndEmail = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError("Incorrect email or password", 500);
  }
  return user;
};

exports.enable2FA = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { twoFactorAuth: true });
  res.status(204).json({
    status: "success",
    data: null,
  });
};
exports.disable2FA = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { twoFactorAuth: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
};
// First part of the logic to handle initial login process and check for Two Factor Authentication

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const active = await User.findOne({ email }).select("active");

    if (!active) {
      return next(
        new AppError(
          `Your Account Has Been Banned Check Your Situation With Our Support Client`,
          500
        )
      );
      console.log("acti", active);
    }
    // 1) Check if email & password exist
    if (!email || !password) {
      return next(new AppError(`Please provide an email and password`, 500));
    }

    // 2) Check if user exists & password is correct
    const user = await verifyUserPasswordAndEmail(email, password);

    // 3) Check if two-factor authentication is enabled
    const userObj = await User.findOne({ email }).select(
      "twoFactorAuth phoneNumber"
    );

    const twoFactorAuth = userObj.twoFactorAuth;
    const userPhone = userObj.phoneNumber;

    if (!twoFactorAuth) {
      return createSendToken(user, 200, res);
    } else if (twoFactorAuth === true) {
      // If two-factor authentication is enabled, send a verification code to the user's phone

      if (!req.query.code) {
        const verification = await client.verify.v2
          .services(process.env.SERVICE_ID)
          .verifications.create({
            to: `${userPhone}`,
            channel: "sms",
          });

        if (verification.status === "pending") {
          res.status(200).send({
            message: "Verification is sent!!",
            user,
          });
          return;
        }
      } else {
        // 3) Verify the code
        const data = await client.verify.v2
          .services(process.env.SERVICE_ID)
          .verificationChecks.create({
            to: `${userPhone}`,
            code: req.query.code,
            user: user,
          });

        if (data.status === "approved") {
          // If the code is verified, log in the user
          createSendToken(user, 200, res);
          return;
        } else {
          // If the code is not verified, send an error response
          return next(new AppError("Wrong verification code", 400));
        }
      }

      // If the control comes here, it means that the two-factor authentication is enabled
      if (!userPhone || TwoAuthStatus !== true) {
        return next(
          new AppError(
            "Two Factor Authentication is not enabled for this user",
            400
          )
        );
      }

      // If the verification code is not provided, send an error response
      if (!req.query.code) {
        return next(new AppError(" verification code is required", 400));
      }

      throw new AppError("Error sending verification code", 500);
    }
  } catch (error) {
    next(error);
  }
};

exports.checkEmail = async (req, res, next) => {
  const email = req.body.email;
  console.log(email);
  try {
    const user = await User.findOne({ email });
    if (user) res.json({ exists: true });
    else res.json({ exists: false });
  } catch (err) {
    return next(new AppError(err));
  }
};

exports.protect = async (req, res, next) => {
  // 1) Getting token & check of it there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  )
    token = req.headers.authorization.split(" ")[1];
  if (!token)
    return next(
      new AppError(`You are not logged in! Please login to get access`, 401)
    );
  try {
    // 1) Getting token & check of it there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    )
      token = req.headers.authorization.split(" ")[1];
    if (!token)
      return next(
        new AppError(`You are not logged in! Please login to get access`, 401)
      );
    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser)
      return next(
        new AppError(`The user belonging to this token does no longer exist`)
      );
    // 4) Check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decoded.iat))
      return next(
        new AppError(`User recently changed password! Please login again`)
      );
    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;
    next();
  } catch (err) {
    return next(new AppError(`Token has expired`, 401));
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(`You don't have permission to perform this action`, 403)
      );
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  // 1) Get User based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError(
        `There's no user with such email address= ` + req.body.email,
        404
      )
    );
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email address
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const resetURLAngular =
    "http://localhost:4200/resetPasswordAfterSubmit?key=" + resetToken;
  const message = `Forgot your password ? Submit a PATCH request with your new password and passwordConfirm to ${resetURLAngular}
  If you didn't forgot your password, please ignore this email!`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Your password reset token (valid for 10 min)`,
      message,
    });
    res.status(200).json({
      status: "success",
      message: "token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        `There was an error sending the email. Try again later!`,
        500
      )
    );
  }
};

exports.resetPassword = async (req, res, next) => {
  // 1) Get the user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If the token has not expired, and there's a user, set the new password
  if (!user) return next(new AppError(`Token is invalid or has expired `, 400));
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
    token,
  });
};
//implement Passport Google OAuth

passport.use(
  new GoogleStrategy(
    {
      // options for the Google strategy
      callbackURL: process.env.CALLBACK_URL,
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// callback route for google to redirect to
exports.googleAuthRedirect = passport.authenticate("google", {
  failureRedirect: "/login",
  session: false,
});

// handle user after authentication
exports.handleGoogleAuth = (req, res) => {
  createSendToken(req.user, 200, res);
};

// login with google
exports.googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// callback route for google to redirect to after authentication
(exports.googleLoginCallback = passport.authenticate("google", {
  failureRedirect: "/login",
  session: false,
})),
  (req, res) => {
    // create and send a token to the client
    const token = generateToken(req.user);
    res.status(200).json({ status: "success", token });
    res.set("Access-Control-Allow-Origin", "http://localhost:4200");
  };

exports.updatePassword = async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 429));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
};

passport.use(
  new FacebookStrategy(
    {
      // options for the Facebook strategy
      callbackURL: process.env.CALLBACK_URL_FACEBOOK,
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      profileFields: [
        "id",
        "displayName",
        "email",
        "first_name",
        "last_name",
        "picture.type(large)",
      ],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // check if user already exists in our database
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
          // generate a random unique email
          const email = `${uuidv4()}@noemail.com`;

          // create new user
          const newUser = new User({
            firstName: profile.name.givenName || profile.name.familyName,
            lastName: profile.name.familyName || profile.name.givenName,
            email: email,
            facebookId: profile.id, // save Facebook ID to database
            image: profile?.photos?.[0]?.value,
          });
          newUser.validateBeforeSave = false;
          user = await newUser.save();
        }
        // return user object
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);
// authenticate with Facebook
exports.facebookAuth = passport.authenticate("facebook", { scope: ["email"] });

// callback route for Facebook to redirect to
exports.facebookAuthRedirect = passport.authenticate("facebook", {
  failureRedirect: "/login",
  session: false,
});

// handle user after authentication
exports.handleFacebookAuth = async (req, res) => {
  try {
    createSendToken(req.user, 200, res);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// login with Facebook
exports.facebookLogin = passport.authenticate("facebook", { scope: ["email"] });

// callback route for Facebook to redirect to after authentication
(exports.facebookLoginCallback = passport.authenticate("facebook", {
  failureRedirect: "/login",
  session: false,
})),
  (req, res) => {
    // create and send a token to the client
    createSendToken(req.user, 200, res);
  };

exports.updateUser = [
  // Use multer middleware to handle the form data
  upload.array("images", 2),
  async (req, res, next) => {
    try {
      // Find the user to update by ID
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new AppError("User not found", 404));
      }

      // Update the user with the new data
      if (req.body.firstName) user.firstName = req.body.firstName;
      if (req.body.lastName) user.lastName = req.body.lastName;
      if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;

      // Upload images to Firebase Cloud Storage
      if (req.files && req.files.length > 0) {
        // Upload new images to Firebase Cloud Storage
        const imageUrls = [];
        for (const file of req.files) {
          const extension = path.extname(file.originalname);
          const filename = `${uuidv4()}${extension}`;
          const fileRef = bucket.file(`users/${filename}`);
          const stream = fileRef.createWriteStream({
            metadata: {
              contentType: file.mimetype,
            },
          });
          stream.on("error", (err) => {
            console.log("Error uploading image: ", err);
          });
          stream.on("finish", async () => {
            const FireBaseToken = uuidv4();
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/users%2F${filename}?alt=media&token=${FireBaseToken}`;
            const imageUrlWithToken = await bucket
              .file(`users/${filename}`)
              .getSignedUrl({
                action: "read",
                expires: "03-17-2024",
                virtualHostedStyle: true,
                query: {
                  alt: "media",
                  token: FireBaseToken,
                },
              });
            imageUrls.push(imageUrlWithToken[0]);
            if (imageUrls.length === req.files.length) {
              user.images = [...user.images.slice(1), ...imageUrls];
              // Save the updated user to the database
              await user.save();
              res.status(200).json({
                status: "success",
                data: {
                  user,
                },
              });
            }
          });
          stream.end(file.buffer);
        }
      } else {
        // Save the updated user to the database if there's no new image
        await user.save();
        res.status(200).json({
          status: "success",
          data: {
            user,
          },
        });
      }
    } catch (err) {
      return next(err);
    }
  },
];
exports.signupoAuth = [
  // Use multer middleware to handle the form data
  upload.array("images", 2),
  async (req, res, next) => {
    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      password,
      confirmPassword,
    } = req.body;
    // Create a random token
    const token = crypto.randomBytes(32).toString("hex");
    // Upload images to Firebase Cloud Storage
    const imageUrls = [];
    if (req.files) {
      for (const file of req.files) {
        const extension = path.extname(file.originalname);
        const filename = `${uuidv4()}${extension}`;
        const fileRef = bucket.file(`users/${filename}`);
        const stream = fileRef.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });
        stream.on("error", (err) => {
          console.log("Error uploading image: ", err);
        });
        stream.on("finish", async () => {
          const FireBaseToken = uuidv4();
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/users%2F${filename}?alt=media&token=${FireBaseToken}`;
          const imageUrlWithToken = await bucket
            .file(`users/${filename}`)
            .getSignedUrl({
              action: "read",
              expires: "03-17-2024",
              virtualHostedStyle: true,
              query: {
                alt: "media",
                token: FireBaseToken,
              },
            });
          imageUrls.push(imageUrlWithToken[0]);
          if (imageUrls.length === req.files.length) {
            const user = await User.create({
              firstName,
              lastName,
              phoneNumber,
              email,
              images: imageUrls,
              password,
              confirmPassword,
              passwordChangedAt: req.body.passwordChangedAt,
              emailVerificationToken: undefined,
              emailVerificationExpires: undefined, // Token expires in 24 hours
              verified: true,
            });
            try {
              createSendToken(user, 201, res);
            } catch (err) {
              // If there's an error while sending email, delete the user

              new AppError(
                "There was an error sending the email. Please try again later.",
                500
              );
            }
          }
        });
        stream.end(file.buffer);
      }
    } else {
      const user = await User.create({
        firstName,
        lastName,
        phoneNumber,
        email,
        images: [],
        password,
        confirmPassword,
        passwordChangedAt: req.body.passwordChangedAt,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
        verified: true, // Token expires in 24 hours
      });
      try {
        createSendToken(user, 201, res);
      } catch (err) {
        // If there's an error while sending email, delete the user

        new AppError(
          "There was an error sending the email. Please try again later.",
          500
        );
      }
    }
  },
];
exports.Sendmeetlink = async (req, res, next) => {
  try {
    const { url, email } = req.body;
    // Send verification email
    await sendEmail({
      email: email,
      subject: "ReSsuply invitation for meet",
      message: `Room link: ${url}`,
    });
  } catch (err) {
    // If there's an error while sending email, delete the user
    return next(
      new AppError(
        "There was an error sending the email. Please try again later.",
        500
      )
    );
  }
};
