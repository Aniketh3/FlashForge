const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String, // Consider hashing passwords in production
    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
    flashcards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard' }]
});

module.exports = mongoose.model('User', userSchema);
