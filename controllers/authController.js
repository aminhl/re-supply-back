const {promisify} = require('util')
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const {v4: uuidv4} = require('uuid');
const multer = require('multer');
const path = require('path');
const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)


// Set up the storage for uploaded images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'C:\\ReSupply\\Test\\re-supply-front\\src\\assets\\client\\images');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

// Create the multer upload object
const upload = multer({storage: storage});
const signToken = (id, role, firstName, lastName, email) => {
    return jwt.sign({id: id, role: role, firstName: firstName, lastName: lastName, email: email},
        process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id, user.role, user.firstName, user.lastName, user.email);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
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

exports.signup = [
    // Use multer middleware to handle the form data
    upload.array('images', 2), async (req, res, next) => {
        const {firstName, lastName, phoneNumber, email, password, confirmPassword} = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return next(new AppError('This email is already taken.', 400));
        }

        // Create a random token
        const token = crypto.randomBytes(32).toString('hex');
        // Create a verification URL with the token
        const verificationURL = `${req.protocol}://${req.get('host')}/api/v1/users/verifyEmail/${token}`;
        const verificationURLAng = "http://localhost:4200/verifyEmail?id="+token;
        // Save the token to the user document
        const user = await User.create({
            firstName,
            lastName,
            phoneNumber,
            email,
            images: req.files ? req.files.map((file) => `/uploads/users/${file.filename}`) : [],
            password,
            confirmPassword,
            passwordChangedAt: req.body.passwordChangedAt,
            emailVerificationToken: token,
            emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // Token expires in 24 hours
        });


        try {
            // Send verification email
            await sendEmail({
                email: user.email,
                subject: 'Please confirm your email',
                message: `Please click the following link to confirm your email: ${verificationURLAng}`,
            });
            createSendToken(user, 201, res);
        } catch (err) {
            // If there's an error while sending email, delete the user


            return next(new AppError('There was an error sending the email. Please try again later.', 500));
        }
    },
];

exports.verifyEmail = async (req, res, next) => {
    const {token} = req.params;
    // Find the user with the given token and check if the token is still valid
    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: {$gt: Date.now()},
    });
    if (!user) {
        return next(new AppError('Invalid or expired token.', 400));
    }
    // Mark the user's email as verified and remove the verification token
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.verified = true;
    await user.save({validateBeforeSave: false});
    res.redirect('http://localhost:4200/verifyEmail');
};
// function to verify user  password
const verifyUserPasswordAndEmail = async (email, password) => {
    const user = await User.findOne({email}).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        throw new AppError('Incorrect email or password', 500);
    }
    return user;
}

exports.enable2FA = async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, {twoFactorAuth: true});
    res.status(204).json({
        status: 'success',
        data: null
    })
}

// First part of the logic to handle initial login process and check for Two Factor Authentication

exports.login = async (req, res, next) => {
    try {
        const {email, password} = req.body;

        // 1) Check if email & password exist
        if (!email || !password) {
            return next(new AppError(`Please provide an email and password`, 500));
        }

        // 2) Check if user exists & password is correct
        const user = await verifyUserPasswordAndEmail(email, password);

        // 3) Check if two-factor authentication is enabled
        const userObj = await User.findOne({email}).select('twoFactorAuth phoneNumber');
        const twoFactorAuth = userObj.twoFactorAuth;
        const userPhone = userObj.phoneNumber;

        if (!twoFactorAuth) {
            return createSendToken(user, 200, res);
        } else if (twoFactorAuth === true) {
            // If two-factor authentication is enabled, send a verification code to the user's phone
            if (userPhone) {
                if (!req.query.code) {
                    const verification = await client.verify.v2
                        .services(process.env.SERVICE_ID)
                        .verifications.create({
                            to: `+216${userPhone}`,
                            channel: 'sms',
                        });

                    if (verification.status === 'pending') {
                        res.status(200).send({
                            message: 'Verification is sent!!',
                        });
                        return;
                    }
                } else {
                    // 3) Verify the code
                    const data = await client.verify.v2.services(process.env.SERVICE_ID).verificationChecks.create({
                        to: `+216${userPhone}`,
                        code: req.query.code,
                    });

                    if (data.status === 'approved') {
                        // If the code is verified, log in the user
                        createSendToken(user, 200, res);
                        return;
                    } else {
                        // If the code is not verified, send an error response
                        return next(new AppError('Wrong verification code', 400));
                    }
                }
            }
            // If the control comes here, it means that the two-factor authentication is enabled
            if (!userPhone || TwoAuthStatus !== true) {
                return next(new AppError('Two Factor Authentication is not enabled for this user', 400));
            }

            // If the verification code is not provided, send an error response
            if (!req.query.code) {
                return next(new AppError(' verification code is required', 400));
            }

            throw new AppError('Error sending verification code', 500);
        }
    } catch (error) {
        next(error);
    }

};

exports.checkEmail = async (req, res, next) => {
    const email = req.body.email;
    try {
        const user = await User.findOne({email});
        if (user) res.json({exists: true});
        else res.json({exists: false});
    } catch (err) {
        return next(new AppError(err));
    }
}

exports.protect = async (req, res, next) => {
    // 1) Getting token & check of it there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
        token = req.headers.authorization.split(' ')[1];
    if (!token) return next(new AppError(`You are not logged in! Please login to get access`, 401));
    try {
        // 1) Getting token & check of it there
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
            token = req.headers.authorization.split(' ')[1];
        if (!token) return next(new AppError(`You are not logged in! Please login to get access`, 401));
        // 2) Verification token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        // 3) Check if user still exists
        const freshUser = await User.findById(decoded.id);
        if (!freshUser) return next(new AppError(`The user belonging to this token does no longer exist`))
        // 4) Check if user changed password after the token was issued
        if (freshUser.changedPasswordAfter(decoded.iat)) return next(new AppError(`User recently changed password! Please login again`));
        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = freshUser;
        next();
    } catch (err) {
        return next(new AppError(`Token has expired`, 401));
    }
}

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role))
            return next(new AppError(`You don't have permission to perform this action`, 403));
        next();
    }
}

exports.forgotPassword = async (req, res, next) => {
    // 1) Get User based on POSTed email
    console.log(req.body)
    const user = await User.findOne({email: req.body.email})
    if (!user) return next(new AppError(`There's no user with such email address= ` + req.body.email, 404));
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});
    // 3) Send it to user's email address
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const resetURLAngular = "http://localhost:4200/resetPasswordAfterSubmit?key=" + resetToken;
    const message = `Forgot your password ? Submit a PATCH request with your new password and passwordConfirm to ${resetURLAngular}
  If you didn't forgot your password, please ignore this email!`;
    try {
        await sendEmail({
            email: user.email,
            subject: `Your password reset token (valid for 10 min)`,
            message
        })
        res.status(200).json({
            status: 'success',
            message: 'token sent to email!'
        })
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});
        return next(new AppError(`There was an error sending the email. Try again later!`, 500))
    }
}

exports.resetPassword = async (req, res, next) => {
    // 1) Get the user based on the token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()}
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
                let user = await User.findOne({email: profile.emails[0].value});
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
    res.status(200).json({status: 'success', token});
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


passport.use(
    new FacebookStrategy(
        {
            // options for the Facebook strategy
            callbackURL: process.env.CALLBACK_URL_FACEBOOK,
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            profileFields: ['id', 'displayName', 'email', 'first_name', 'last_name', 'picture.type(large)'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // check if user already exists in our database
                let user = await User.findOne({facebookId: profile.id});
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
exports.facebookAuth = passport.authenticate('facebook', {scope: ['email']});

// callback route for Facebook to redirect to
exports.facebookAuthRedirect = passport.authenticate('facebook', {
    failureRedirect: '/login',
    session: false,
});

// handle user after authentication
exports.handleFacebookAuth = async (req, res) => {
    try {
        createSendToken(req.user, 200, res);
    } catch (err) {
        res.status(500).json({status: 'error', message: err.message});
    }
};

// login with Facebook
exports.facebookLogin = passport.authenticate('facebook', {scope: ['email']});

// callback route for Facebook to redirect to after authentication
exports.facebookLoginCallback = passport.authenticate('facebook', {
    failureRedirect: '/login',
    session: false,
}), (req, res) => {
    // create and send a token to the client
    createSendToken(req.user, 200, res);
};