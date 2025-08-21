const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
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
        default: '#f1c40f'
    },
    milestoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Milestone',
        default: null
    },
    completed: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('Topic', TopicSchema);