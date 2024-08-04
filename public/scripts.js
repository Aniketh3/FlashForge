let currentQuestionIndex = 0;
let questions = [];
let score = 0;
let selectedOptions = [];
let flashcards = [];
let currentFlashcardIndex = 0;

// Sidebar toggle functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const container = document.querySelector('.container');
    const toggleBtn = document.getElementById('toggle-sidebar');
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('shifted');
    container.classList.toggle('shifted');
    
    if (sidebar.classList.contains('active')) {
        toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    }
}

// Close sidebar and overlay when clicking on overlay
document.getElementById('overlay').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// Fetch and display user's quiz history
async function fetchQuizHistory() {
    try {
        const response = await fetch('/user-quizzes', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const quizzes = await response.json();
        const quizList = document.getElementById('quiz-list');
        quizList.innerHTML = '';
        quizzes.forEach(quiz => {
            const li = document.createElement('li');
            li.textContent = quiz.title;
            li.onclick = () => {
                loadQuiz(quiz._id);
                hideSidebar(); // Hide sidebar after selection
            };
            quizList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching quiz history:', error);
    }
}

async function fetchFlashcardHistory() {
    try {
        const response = await fetch('/user-flashcards', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const flashcards = await response.json();
        const flashcardList = document.getElementById('flashcard-list');
        flashcardList.innerHTML = '';
        flashcards.forEach(flashcard => {
            const li = document.createElement('li');
            li.textContent = flashcard.title;
            li.onclick = () => {
                loadFlashcard(flashcard._id);
                hideSidebar(); // Hide sidebar after selection
            };
            flashcardList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching flashcard history:', error);
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    } else {
        fetchUserInfo();
        fetchQuizHistory();
        fetchFlashcardHistory();
        document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
    }
});

async function fetchUserInfo() {
    try {
        const response = await fetch('/user-info', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (response.ok) {
            const user = await response.json();
            document.getElementById('welcome-message').textContent = `Welcome, ${user.username}!`;
        } else {
            throw new Error('Failed to fetch user info');
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        logout();
    }
}
async function logout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (response.ok) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Failed to logout. Please try again.');
    }
}

async function loadQuiz(quizId) {
    try {
        const response = await fetch(`/quiz/${quizId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to load quiz');
        }
        const quiz = await response.json();

        showSection('question-container');
        document.getElementById('quiz-title').innerText = quiz.title;

        questions = quiz.questions;
        selectedOptions = new Array(questions.length).fill(null);
        currentQuestionIndex = 0;
        score = 0;
        showQuestion();

    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Failed to load quiz. Please try again.');
    }
}

async function loadFlashcard(flashcardId) {
    try {
        const response = await fetch(`/flashcard/${flashcardId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to load flashcard');
        }
        const flashcard = await response.json();

        showSection('flashcard-container');
        document.getElementById('flashcard-title').innerText = flashcard.title;

        flashcards = flashcard.flashcards;
        currentFlashcardIndex = 0;
        showFlashcard();

    } catch (error) {
        console.error('Error loading flashcard:', error);
        alert('Failed to load flashcard. Please try again.');
    }
}


async function generateContent(type) {
    const topic = document.getElementById('topic').value;
    const number = document.getElementById('number').value;
    const imageInput = document.getElementById('image-upload');
    
    if ((!topic && !imageInput.files[0]) || !number) {
        alert('Please enter a topic or upload an image, and specify the number of items');
        return;
    }

    // Show loading screen
    document.getElementById('loading-screen').style.display = 'flex';

    try {
        const formData = new FormData();
        formData.append('topic', topic);
        formData.append('number', number);
        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }

        const endpoint = type === 'quiz' ? '/generate-quiz' : '/generate-flashcards';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const data = await response.json();

        if (type === 'quiz') {
            questions = data.questions;
            selectedOptions = new Array(questions.length).fill(null);
            document.getElementById('question-container').style.display = 'block';
            document.getElementById('quiz-title').innerText = data.title;
            document.getElementById('main-form').style.display = 'none';
        
            showQuestion();
        } else {
            flashcards = data.flashcards;
            document.getElementById('flashcard-title').innerText = data.title;
            document.getElementById('main-form').style.display = 'none';
            document.getElementById('flashcard-container').style.display = 'block';
            showFlashcard();
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`Failed to generate ${type}. Please try again.`);
    } finally {
        // Hide loading screen
        document.getElementById('loading-screen').style.display = 'none';
    }
}

document.getElementById('question-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const selectedOption = document.querySelector('input[name="option"]:checked');
    if (selectedOption) {
        const answer = selectedOption.value;
        selectedOptions[currentQuestionIndex] = answer;

        if (answer === questions[currentQuestionIndex].answer) {
            score++;
        }
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            showScore();
        }
    } else {
        alert('Please select an option');
    }
});

document.getElementById('previous-btn').addEventListener('click', function(event) {
    event.preventDefault();
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
});

function showSection(sectionId) {
    // Hide all sections
    const sections = ['main-form', 'question-container', 'flashcard-container', 'score-container'];
    sections.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });

    // Show the requested section
    document.getElementById(sectionId).style.display = 'block';
}

function showQuestion() {
    const question = questions[currentQuestionIndex];
    document.getElementById('question').innerText = question.question;
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.innerHTML = `
            <input type="radio" id="${option}" name="option" value="${option}" ${selectedOptions[currentQuestionIndex] === option ? 'checked' : ''}>
            <label for="${option}">${option}</label>
        `;
        optionsContainer.appendChild(optionElement);
    });
}

function showFlashcard() {
    const flashcard = flashcards[currentFlashcardIndex];
    document.getElementById('flashcards').innerHTML = `
        <div class="flashcard" onclick="flipFlashcard(this)">
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <strong>Term:</strong> ${flashcard.term}
                </div>
                <div class="flashcard-back">
                    <strong>Definition:</strong> ${flashcard.definition}
                </div>
            </div>
        </div>
        <button ${currentFlashcardIndex === 0 ? 'disabled' : ''} onclick="prevFlashcard()">Previous</button>
        <button ${currentFlashcardIndex === flashcards.length - 1 ? 'disabled' : ''} onclick="nextFlashcard()">Next</button>
    `;
}

function flipFlashcard(element) {
    element.classList.toggle('flip');
}

function nextFlashcard() {
    if (currentFlashcardIndex < flashcards.length - 1) {
        currentFlashcardIndex++;
        showFlashcard();
    }
}

function prevFlashcard() {
    if (currentFlashcardIndex > 0) {
        currentFlashcardIndex--;
        showFlashcard();
    }
}

function showScore() {
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('score-container').style.display = 'block';
    document.getElementById('score').innerText = `Your score: ${score} / ${questions.length}`;
}

function restartQuiz() {
    document.getElementById('score-container').style.display = 'none';
    document.getElementById('main-form').style.display = 'block';
    currentQuestionIndex = 0;
    score = 0;
    selectedOptions = [];
}

function restartFlashcards() {
    document.getElementById('flashcard-container').style.display = 'none';
    document.getElementById('main-form').style.display = 'block';
    currentFlashcardIndex = 0;
}
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const container = document.querySelector('.container');
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('shifted');
    container.classList.toggle('shifted');
}

function showSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('active');
}

function hideSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    } else {
        fetchUserInfo();
        fetchQuizHistory();
        fetchFlashcardHistory();
        
        // Add sidebar trigger
        const sidebarTrigger = document.createElement('div');
        sidebarTrigger.className = 'sidebar-trigger';
        document.body.appendChild(sidebarTrigger);
        
        sidebarTrigger.addEventListener('mouseenter', showSidebar);
        
        // Update this line to use the sidebarTrigger instead of the sidebar itself
        sidebarTrigger.addEventListener('mouseleave', hideSidebar);
        
        // Add event listener to keep sidebar open when mouse is over it
        document.getElementById('sidebar').addEventListener('mouseenter', showSidebar);
        document.getElementById('sidebar').addEventListener('mouseleave', hideSidebar);
        
        // Add logout button event listener
        document.getElementById('logout-btn').addEventListener('click', logout);
    }
});



async function analyzeImageAndGenerate(type) {
    const imageInput = document.getElementById('image-upload');
    const number = document.getElementById('number').value;
    
    if (!imageInput.files[0] || !number) {
        alert('Please upload an image and enter the number of questions/flashcards');
        return;
    }

    // Show loading screen
    document.getElementById('loading-screen').style.display = 'flex';

    try {
        // First, send the image to the server for analysis
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);

        const analysisResponse = await fetch('/analyze-image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!analysisResponse.ok) {
            throw new Error('Failed to analyze image');
        }

        const analysisResult = await analysisResponse.text();

        // Now generate the quiz or flashcards using the analysis result
        const endpoint = type === 'quiz' ? '/generate-quiz' : '/generate-flashcards';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ topic: analysisResult, number })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const data = await response.json();

        if (type === 'quiz') {
            questions = data.questions;
            selectedOptions = new Array(questions.length).fill(null);
            document.getElementById('quiz-title').innerText = data.title;
            document.getElementById('main-form').style.display = 'none';
            document.getElementById('question-container').style.display = 'block';
            showQuestion();
        } else {
            flashcards = data.flashcards;
            document.getElementById('flashcard-title').innerText = data.title;
            document.getElementById('main-form').style.display = 'none';
            document.getElementById('flashcard-container').style.display = 'block';
            showFlashcard();
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`Failed to generate ${type}. Please try again.`);
    } finally {
        // Hide loading screen
        document.getElementById('loading-screen').style.display = 'none';
    }
}



// Add this event listener to update the file input label
document.getElementById('image-upload').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'Upload Image';
    document.querySelector('.file-upload-label').textContent = fileName;
});

// Update the existing event listeners
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    } else {
        fetchUserInfo();
        fetchQuizHistory();
        fetchFlashcardHistory();
        document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
        document.getElementById('image-upload').addEventListener('change', updateFileInputLabel);
    }
});

function updateFileInputLabel(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'Upload Image';
    document.querySelector('.file-upload-label').textContent = fileName;
}

