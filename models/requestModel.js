const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema(
    {
        requester_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        requestTitle: {
            type: String,
            required: false,
        },
        type: {
            type: String,
            enum: ['Item', 'Currency'],
            required: true,
        },
        itemType: {
            type: String,
            required: false,
        },
        targetValue: {
            type: Number,
            required: false,
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
        isApproved: {
            type: Boolean,
            default: false,
        },
        notes: {
            type: String,
        },
    },
    { timestamps: true }
);

const Request = mongoose.model('Request', RequestSchema);

module.exports = Request;
