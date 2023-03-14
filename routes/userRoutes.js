const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const passport = require('passport');

const router = express.Router();

// Authentication Routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/checkEmail', authController.checkEmail);

// OAuth google routes
router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/redirect', authController.googleAuthRedirect, authController.handleGoogleAuth);
router.get('/auth/google/login', authController.googleLogin);
router.get('/auth/google/login/redirect', authController.googleLoginCallback);

// Email verification-Reset
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updatePassword', authController.protect, authController.updatePassword);
router.get('/verifyEmail/:token', authController.verifyEmail);

// OAuth facebook routes
router.route('/auth/facebook').get(authController.facebookAuth);
router.route('/auth/facebook/redirect').get(authController.facebookAuthRedirect, authController.handleFacebookAuth);
router.route('/auth/facebook/login').get(authController.facebookLogin);
router.route('/auth/facebook/login/redirect').get(authController.facebookLoginCallback);

// User Routes
router.patch('/updateProfile', authController.protect, userController.updateProfile);
router.delete('/deactivateAccount', authController.protect, userController.deactivateAccount);
router.route('/').get(authController.protect, authController.restrictTo("admin",""),userController.getAllUsers);

module.exports = router;
