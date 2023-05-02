const mongoose = require('mongoose');

const resourcesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    title: {
        type: String,
        required: [true, 'A resources must have a title'],
    },
    description: {
        type: String,
        required: [true, 'A resources must have a description'],
    },
    status: {
        type: String,
        enum: ['accepted', 'pending', 'rejected'],
        default: 'pending'
    },
    postedAt: {
        type: Date,
        default: Date.now()
    },
    files: [String],
    image: [String],

});

const Resource = mongoose.model('Resource', resourcesSchema);
module.exports = Resource;
