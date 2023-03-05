const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A product must have a name'],
    },
    description: {
        type: String,
        required: [true, 'A product must have a description'],
    },
    price: {
        type: Number,
        required: [true, 'A product must have a price'],
    },
    images: [String],
    status: {
        type: String,
        enum: ['accepted', 'pending', 'rejected'],
        default: 'pending'
    },
    postedAt: {
        type: Date,
        default: Date.now()
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }
});

module.exports = mongoose.model('Product', productSchema);