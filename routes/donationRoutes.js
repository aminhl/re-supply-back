const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const authController = require("../controllers/authController");


router.get('/', donationController.getAllDonations);

router.get('/:id', donationController.getDonationById);

router.post('/', donationController.createDonation);

router.put('/:id', donationController.updateDonation);

router.delete('/:id', donationController.deleteDonation);

router.post("/sendETH", donationController.sendETH);

module.exports = router;
