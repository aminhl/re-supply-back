const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    content: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['accepted', 'pending', 'rejected'],
        default: 'pending'
    },
    postedAt: {
        type: Date,
        default: Date.now
    },
    image: {
        data: Buffer,
        contentType: String
    }
});

const CommentModel = mongoose.model('Comment', commentSchema)

module.exports = CommentModel;