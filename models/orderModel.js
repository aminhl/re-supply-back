//create an order model with mongoose
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    supplies: [
        {
            supply: {
                type: mongoose.Schema.ObjectId,
                ref: 'Supply',

            }}],
    quantity: {
        type: Number,
        required: [true, 'An order must have a quantity'],
    },
    totalPrice: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    }
});
module.exports = mongoose.model('Order', orderSchema);