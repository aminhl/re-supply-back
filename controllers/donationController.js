const Donation = require('../models/donationModel');
const Web3 = require("web3");
const Request = require('../models/requestModel');

// Create new donation
const createDonation = async (req, res) => {
    try {
        const { donor_id, recipient_id, type, value, notes } = req.body;
        const donation = new Donation({ donor_id, recipient_id, type, value, notes });
        await donation.save();
        res.status(201).json(donation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get all donations
const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find();
        res.json(donations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get donation by ID
const getDonationById = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        res.json(donation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update donation
const updateDonation = async (req, res) => {
    try {
        const { donor_id, recipient_id, type, value, notes } = req.body;
        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        donation.donor_id = donor_id;
        donation.recipient_id = recipient_id;
        donation.type = type;
        donation.value = value;
        donation.notes = notes;
        await donation.save();
        res.json(donation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete donation
const deleteDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        await donation.remove();
        res.json({ message: 'Donation deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const axios = require('axios');

async function convertETHtoUSD(ethAmount) {
    try {
        // Get the current ETH price in USD
        const response = await axios
          .get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const ethPrice = response.data.ethereum.usd;
        // Convert the ETH amount to USD
        const usdAmount = ethAmount * ethPrice;
        return usdAmount.toFixed(2); // Specify 2 decimal places for USD amount
    } catch (error) {
        console.error(error);
    }
}

const updateDonationRequest = async (req, res) => {
    const requestId = req.params.requestId;
    const request = await Request.findById(requestId);
    const { amount } = req.body;
    try {
        const usdAmount = await convertETHtoUSD(amount);
        request.currentValue += +usdAmount;
        await request.save();
        res.status(200).json({ message: "Transaction sent" });
    } catch (error){
        res.status(500).json({ message: "Transaction failed", error });
    }
};


module.exports = { createDonation, getAllDonations, getDonationById, updateDonation, deleteDonation, updateDonationRequest };
