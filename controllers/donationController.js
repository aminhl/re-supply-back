const Donation = require('../models/donationModel');

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

module.exports = { createDonation, getAllDonations, getDonationById, updateDonation, deleteDonation };
