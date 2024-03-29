const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema(
    {
        donor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        request_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Request',
            required: true,
        },
        type: {
            type: String,
            enum: ['Item', 'Currency'],
            required: true,
        },
        value: {
            type: Number,
            required: true,
        },
        postedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        notes: {
            type: String,
        },
    },
    { timestamps: true }
);

const Donation = mongoose.model('Donation', DonationSchema);

module.exports = Donation;