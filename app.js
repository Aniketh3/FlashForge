const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const path = require('path');

const apiKey = 'ng-sfnua0ea27avacOpoHoMr4vr9ArUm';
const baseURL = 'https://api.naga.ac/v1';

const openai = new OpenAI(apiKey, baseURL);
const app = express();
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.post('/generate-quiz', async (req, res) => {
    const { topic, number } = req.body;

    const prompt = `
        You are an API. Your work is to make quizzes about various ${topic} and you have to make ${number} of question. Remember, you can only answer in the given format and you can't talk. If you talk, the app crashes. Give your response in this format only:
        dont add json or \`\`\` in the answer.
        {
            "title": "${topic} Quiz",
            "questions": [
                {
                    "question": "Example question?",
                    "options": ["Option1", "Option2", "Option3", "Option4"],
                    "answer": "Option1"
                }
                # Add more questions as needed
            ]
        }
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: prompt }
            ]
        });

        const quiz = JSON.parse(response.choices[0].message.content);
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
});

app.post('/generate-flashcards', async (req, res) => {
    const { topic, number } = req.body;

    const prompt = `
        You are an API. Your work is to make flashcards about various ${topic} and you have to make ${number} of flashcards. Remember, you can only answer in the given format and you can't talk. If you talk, the app crashes. Give your response in this format only:
        dont add json or \`\`\` in the answer.
        {
            "title": "${topic} Flashcards",
            "flashcards": [
                {
                    "term": "Example term",
                    "definition": "Example definition"
                }
                # Add more flashcards as needed
            ]
        }
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: prompt }
            ]
        });

        const flashcards = JSON.parse(response.choices[0].message.content);
        res.json(flashcards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate flashcards' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
