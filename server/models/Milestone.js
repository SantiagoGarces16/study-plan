const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    color: {
        type: String,
        default: '#9b59b6'
    }
});

module.exports = mongoose.model('Milestone', MilestoneSchema);