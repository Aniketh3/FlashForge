const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
    title: String,
    flashcards: [{
        term: String,
        definition: String
    }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Reference to the User model
});

module.exports = mongoose.model('Flashcard', flashcardSchema);
