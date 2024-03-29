const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const passport = require("passport");
const requestController = require("../controllers/requestController");

const router = express.Router();

// Authentication Routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/enable2FA", authController.protect, authController.enable2FA);
router.post("/disable2FA", authController.protect, authController.disable2FA);
router.get(
  "/findActive",
  authController.protect,
  userController.getVerifiedUsers
);
router.get(
  "/findInactive",
  authController.protect,
  userController.getUnverifiedUsers
);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/checkEmail", authController.checkEmail);
router.get("/email-verification/:id", userController.checkEmailVerification);

// OAuth google routes
router.get("/auth/google", authController.googleAuth);
router.get(
  "/auth/google/redirect",
  authController.googleAuthRedirect,
  authController.handleGoogleAuth
);
router.get("/auth/google/login", authController.googleLogin);
router.get("/auth/google/login/redirect", authController.googleLoginCallback);

// Email verification-Reset
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch(
  "/updatePassword",
  authController.protect,
  authController.updatePassword
);
router.get("/verifyEmail/:token", authController.verifyEmail);

// OAuth facebook routes
router.route("/auth/facebook").get(authController.facebookAuth);
router
  .route("/auth/facebook/redirect")
  .get(authController.facebookAuthRedirect, authController.handleFacebookAuth);
router.route("/auth/facebook/login").get(authController.facebookLogin);
router
  .route("/auth/facebook/login/redirect")
  .get(authController.facebookLoginCallback);

// User Routes
router.patch(
  "/updateProfile",
  authController.protect,
  authController.restrictTo("admin", "member"),
  userController.updateProfile
);
router.delete(
  "/deactivateAccount",
  authController.protect,
  userController.deactivateAccount
);
router.get("/user", authController.protect, userController.getUser);

router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin", "member"),
    userController.getAllUsers
  );
router
  .route("/chatUsers")
  .get(
    authController.protect,
    authController.restrictTo("admin", "member"),
    userController.searchChatUsers
  );

router
  .route("/update")
  .patch(
    authController.protect,
    authController.restrictTo("admin", "member"),
    authController.updateUser
  );

router.route("/delete/:id").delete(userController.deleteAccount);

router.route("/upgrade/:id").patch(userController.upgradeToAdmin);

router.post("/signupoAuth", authController.signupoAuth);
router.post(
  "/Sendmeetlink",
  authController.protect,
  authController.Sendmeetlink
);
router.post("/doScore", authController.protect,userController.calculateRequestScores);
router.get('/:id',authController.protect, requestController.getRequestById);
router.put('/setWalletAddress', authController.protect, authController.setWalletAddress)

module.exports = router;
