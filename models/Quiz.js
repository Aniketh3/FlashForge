const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    title: String,
    questions: [{
        question: String,
        options: [String],
        answer: String
    }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Reference to the User model
});

module.exports = mongoose.model('Quiz', quizSchema);
