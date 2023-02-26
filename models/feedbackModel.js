const mongoose = require('mongoose');
const {default: validator} = require("validator");

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A feedback must have a name'],
    },
    email: {
        type: String,
        required: [true, 'A feedback must have an email'],
        validate: [validator.isEmail, 'Please provide a valid email address']
    },
    message: {
        type: String,
        required: [true, 'A feedback must have a message'],
    }

});
module.exports = mongoose.model('Feedback', feedbackSchema);