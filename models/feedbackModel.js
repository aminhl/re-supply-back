const mongoose = require('mongoose');
const {default: validator} = require("validator");

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    title: {
        type: String,
        required: [true, 'A feedback must have a title'],
    },
    message: {
        type: String,
        required: [true, 'A feedback must have a message'],
    },
    category: {
        type: String,
    }

});
module.exports = mongoose.model('Feedback', feedbackSchema);