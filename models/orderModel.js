//create an order model with mongoose
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    products: [
        {
            product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',

            }}],
    totalPrice: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }
});
module.exports = mongoose.model('Order', orderSchema);
