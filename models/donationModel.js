const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donorName: {
        type: String,
        required: true},
    amount: {
        type: Number,
        required: true},
    date: {
            type: Date,
            default: Date.now},
    status: {
        type: String,
        enum: ['pending', 'received'], default: 'pending'},
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;



