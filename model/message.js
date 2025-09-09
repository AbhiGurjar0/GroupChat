const mongoose = require('mongoose');
const group = require('./group');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    groupId:{type: mongoose.Schema.Types.ObjectId, ref: 'Group'},
    message: String,
    type: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);