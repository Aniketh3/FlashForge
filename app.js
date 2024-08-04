


const bodyParser = require('body-parser');
const OpenAI = require('openai');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

require('dotenv').config();

dotenv.config();

const upload = multer({ dest: 'uploads/' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Define MongoDB URI and connect to MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});

// Define models
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const Flashcard = require('./models/Flashcard');

// Initialize OpenAI
const apiKey = process.env.API_KEY;
const baseURL = process.env.BASE_URL;
const openai = new OpenAI({ apiKey, baseURL });

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Get User Quizzes
app.get('/user-quizzes', authenticateToken, async (req, res) => {
    try {
        const quizzes = await Quiz.find({ user: req.user.userId });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve quizzes' });
    }
});

// Get User Flashcards
app.get('/user-flashcards', authenticateToken, async (req, res) => {
    try {
        const flashcards = await Flashcard.find({ user: req.user.userId });
        res.json(flashcards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve flashcards' });
    }
});
// User registration
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// User login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user == null) return res.status(400).json({ error: 'Cannot find user' });

    try {
        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(403).json({ error: 'Invalid credentials' });
        }
    } catch {
        res.status(500).json({ error: 'Error during login' });
    }
});

// Generate Quiz
app.post('/generate-quiz', authenticateToken, upload.single('image'), async (req, res) => {
    const { topic, number } = req.body;
    let contentToUse = topic;

    if (req.file) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const imagePart = {
                inlineData: {
                    data: Buffer.from(fs.readFileSync(req.file.path)).toString("base64"),
                    mimeType: req.file.mimetype,
                },
            };
            const result = await model.generateContent(["Analyze this image and provide a detailed description of its contents.", imagePart]);
            contentToUse = result.response.text();
            fs.unlinkSync(req.file.path); // Clean up the uploaded file
        } catch (error) {
            console.error('Error analyzing image:', error);
            return res.status(500).json({ error: 'Failed to analyze image' });
        }
    }

    const prompt = `
        You are an API. Your work is to make quizzes about various ${contentToUse} and you have to make ${number} of questions. Remember, you can only answer in the given format and you can't talk. If you talk, the app crashes. Give your response in this format only:
        dont add json or \`\`\` in the answer.
        {
            "title": " Quiz",
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

        const quizData = JSON.parse(response.choices[0].message.content);
        
        const newQuiz = new Quiz({
            title: quizData.title,
            questions: quizData.questions,
            user: req.user.userId
        });

        await newQuiz.save();
        await User.findByIdAndUpdate(req.user.userId, { $push: { quizzes: newQuiz._id } });

        res.json(newQuiz);
    } catch (error) {
        console.error('Error generating quiz:', error.message);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }});

// Generate Flashcards
app.post('/generate-flashcards', authenticateToken, upload.single('image'), async (req, res) => {
    const { topic, number } = req.body;
    let contentToUse = topic;

    if (req.file) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const imagePart = {
                inlineData: {
                    data: Buffer.from(fs.readFileSync(req.file.path)).toString("base64"),
                    mimeType: req.file.mimetype,
                },
            };
            const result = await model.generateContent(["Analyze this image and provide a detailed description of its contents.", imagePart]);
            contentToUse = result.response.text();
            fs.unlinkSync(req.file.path); // Clean up the uploaded file
        } catch (error) {
            console.error('Error analyzing image:', error);
            return res.status(500).json({ error: 'Failed to analyze image' });
        }
    }


    const prompt = `
        You are an API. Your work is to make flashcards about various ${contentToUse} and you have to make ${number} of flashcards. Remember, you can only answer in the given format and you can't talk. If you talk, the app crashes. Give your response in this format only:
        dont add json or \`\`\` in the answer.
        {
            "title": "${contentToUse} Flashcards",
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

        const flashcardData = JSON.parse(response.choices[0].message.content);
        
        const newFlashcard = new Flashcard({
            title: flashcardData.title,
            flashcards: flashcardData.flashcards,
            user: req.user.userId
        });

        await newFlashcard.save();
        await User.findByIdAndUpdate(req.user.userId, { $push: { flashcards: newFlashcard._id } });

        res.json(newFlashcard);
    } catch (error) {
        console.error('Error generating flashcards:', error.message);
        res.status(500).json({ error: 'Failed to generate flashcards' });
    }
});

// Get User Quizzes
app.get('/user-quizzes', authenticateToken, async (req, res) => {
    try {
        const quizzes = await Quiz.find({ user: req.user.userId });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve quizzes' });
    }
});

// Get User Flashcards
app.get('/user-flashcards', authenticateToken, async (req, res) => {
    try {
        const flashcards = await Flashcard.find({ user: req.user.userId });
        res.json(flashcards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve flashcards' });
    }
});

// Get User Info
app.get('/user-info', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve user information' });
    }
});

// Logout
app.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/quiz/:quizId', authenticateToken, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve quiz' });
    }
});

app.get('/flashcard/:flashcardId', authenticateToken, async (req, res) => {
    try {
        const flashcard = await Flashcard.findById(req.params.flashcardId);
        if (!flashcard) {
            return res.status(404).json({ error: 'Flashcard not found' });
        }
        res.json(flashcard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve flashcard' });
    }
});
app.post('/analyze-image', authenticateToken, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = "Analyze this image and provide a detailed description of its contents under 200 words only";
        console.log(prompt);
        const imagePart = {
            inlineData: {
                data: Buffer.from(fs.readFileSync(req.file.path)).toString("base64"),
                mimeType: req.file.mimetype,
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);

        res.send(text);
    } catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).json({ error: 'Failed to analyze image' });
    }
});
