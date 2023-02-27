const Donation = require('../models/donationModel');

const getDonations = async (req, res) => {
    try {
        const donations = await Donation.find(req.query);
        res.send(donations);
    } catch (err) {
        res.status(400).send(err);
    }
};

const getDonationById = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            res.status(404).send('Donation not found');
        } else {
            res.send(donation);
        }
    } catch (err) {
        res.status(400).send(err);
    }
};


const createDonation = async (req, res) => {
    try {
        const newDonation = new Donation(req.body);
        await newDonation.save();
        res.status(201).send(newDonation);
    } catch (err) {
        res.status(400).send(err);
    }
};


const updateDonation = async (req, res) => {
    try {
        const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!donation) {
            res.status(404).send('Donation not found');
        } else {
            res.send(donation);
        }
    } catch (err) {
        res.status(400).send(err);
    }
};


const deleteDonation = async (req, res) => {
    try {
        const donation = await Donation.findByIdAndDelete(req.params.id);
        if (!donation) {
            res.status(404).send('Donation not found');
        } else {
            res.send(donation);
        }
    } catch (err) {
        res.status(400).send(err);
    }
};

module.exports = {
    getDonations,
    getDonationById,
    createDonation,
    updateDonation,
    deleteDonation,
};
