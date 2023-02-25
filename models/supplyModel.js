const mongoose = require('mongoose');


const supplySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A supply must have a name'],
    },
    description: {
        type: String,
        required: [true, 'A supply must have a description'],
    },
    price: {
        type: Number,
        required: [true, 'A supply must have a price'],
    },
    quantity: {
        type: Number,
    },
    image: {
        type: String,
        required: [true, 'A supply must have an image'],
    },
    postedAt: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Supply', supplySchema);