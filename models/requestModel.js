const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema(
    {
        requester_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['Item', 'Currency'],
            required: true,
        },
        targetValue: {
            type: Number,
            required: true,
        },
        currentValue: {
            type: Number,
            default: 0,
        },
        requestImage:[String],
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

const Request = mongoose.model('Request', RequestSchema);

module.exports = Request;
