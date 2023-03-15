const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const cryptoController = require('../controllers/cryptoPaymenetController');


router.get('/', donationController.getAllDonations);

router.get('/:id', donationController.getDonationById);

router.post('/', donationController.createDonation);

router.put('/:id', donationController.updateDonation);

router.delete('/:id', donationController.deleteDonation);


module.exports = router;
