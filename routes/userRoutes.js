const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const passport = require('passport');

const router = express.Router();

// Authentication Routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);

router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/redirect', authController.googleAuthRedirect, authController.handleGoogleAuth);
router.get('/auth/google/login', authController.googleLogin);
router.get('/auth/google/login/redirect', authController.googleLoginCallback);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updatePassword', authController.protect, authController.updatePassword);
// User Routes
router.patch('/updateProfile', authController.protect, userController.updateProfile);
router.delete('/deactivateAccount', authController.protect, userController.deactivateAccount);
router.route('/').get(authController.protect, authController.restrictTo("admin",""),userController.getAllUsers);

module.exports = router;
