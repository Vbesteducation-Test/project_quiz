document.getElementById("quizForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const classLevel = document.getElementById("classLevel").value;
    const subject = document.getElementById("subject").value;
    const chapter = document.getElementById("chapter").value;
    const topic = document.getElementById("topic").value;
    const difficulty = document.getElementById("difficulty").value;
    const numQuestions = document.getElementById("numQuestions").value;

    if (!classLevel || !subject || !chapter || !topic || !difficulty || !numQuestions) {
        alert("Please fill in all fields before starting the quiz.");
        return;
    }

    try {
        const startButton = document.getElementById("startQuizBtn");
        startButton.innerText = "Loading...";
        startButton.disabled = true;

        const response = await fetch("http://localhost:3000/generate-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classLevel, subject, chapter, topic, difficulty, numQuestions }),
        });

        const data = await response.json();
        console.log("Quiz Data:", data);

        if (data.questions) {
            startQuiz(data.questions, difficulty);
        } else {
            alert("Failed to load quiz. Please try again.");
        }
    } catch (error) {
        console.error("Error fetching quiz:", error);
        alert("An error occurred while loading the quiz.");
    } finally {
        startButton.innerText = "Start Quiz";
        startButton.disabled = false;
    }
});

let questions = [];
let currentQuestionIndex = 0;
const selectedAnswers = {};
let timerInterval;
let totalQuizTime;
let timeLeft;
let questionTimes = [];
let quizStartTime;

function getTimerDuration(difficulty, numQuestions) {
    return difficulty === "Easy" ? 30 * numQuestions :
           difficulty === "Medium" ? 45 * numQuestions :
           60 * numQuestions;
}

function startQuiz(fetchedQuestions, difficulty) {
    questions = fetchedQuestions;
    currentQuestionIndex = 0;
    questionTimes = new Array(questions.length).fill(0);
    quizStartTime = new Date();

    totalQuizTime = getTimerDuration(difficulty, questions.length);
    timeLeft = totalQuizTime;

    document.getElementById("quizFormContainer").classList.add("hidden");
    document.getElementById("quizContainer").classList.remove("hidden");

    generateNavigationPanel();
    startTimer();
    showQuestion();
}

function startTimer() {
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up! Submitting quiz automatically.");
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById("quizTimer").innerText = `Time Left: ${formatTime(timeLeft)}`;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

function showQuestion() {
    if (currentQuestionIndex > 0) {
        questionTimes[currentQuestionIndex - 1] += (totalQuizTime - timeLeft);
    }

    const questionDisplay = document.getElementById("questionDisplay");
    const currentQuestion = questions[currentQuestionIndex];

    questionDisplay.innerHTML = `
        <p><strong>Q${currentQuestionIndex + 1}:</strong> ${currentQuestion.question}</p>
        <div class="options-container">
            ${currentQuestion.options.map((option, i) => `
                <label class="option">
                    <input type="radio" name="q${currentQuestionIndex}" value="${option}" 
                        ${selectedAnswers[`q${currentQuestionIndex}`] === option ? 'checked' : ''}>
                    <span class="option-text">${option}</span>  
                </label>
            `).join("")}
        </div>
    `;

    highlightActiveQuestion();

    
    document.getElementById("prevBtn").classList.toggle("hidden", currentQuestionIndex === 0);
    document.getElementById("nextBtn").classList.toggle("hidden", currentQuestionIndex === questions.length - 1);
    document.getElementById("submitQuizBtn").classList.toggle("hidden", currentQuestionIndex !== questions.length - 1);
}  

function saveAnswer() {
    const selectedOption = document.querySelector(`input[name="q${currentQuestionIndex}"]:checked`);
    const navButtons = document.querySelectorAll(".nav-btn");

    if (selectedOption) {
        selectedAnswers[`q${currentQuestionIndex}`] = selectedOption.value;
        navButtons[currentQuestionIndex].classList.add("attempted");
    } else {
        navButtons[currentQuestionIndex].classList.add("skipped");
    }
}

document.getElementById("nextBtn").addEventListener("click", function () {
    saveAnswer();
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    }
});

document.getElementById("prevBtn").addEventListener("click", function () {
    saveAnswer();
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
});

function submitQuiz() {
    saveAnswer();
    clearInterval(timerInterval);

    const quizEndTime = new Date();
    const totalTimeTaken = Math.round((quizEndTime - quizStartTime) / 1000);
    questionTimes[currentQuestionIndex] += (totalQuizTime - timeLeft);

    let score = 0;
    const totalQuestions = questions.length;
    const resultContainer = document.getElementById("resultContainer");

    resultContainer.innerHTML = `<h3>Results</h3><ul class="result-list">`;

    questions.forEach((questionObj, index) => {
        let correctAnswer = questionObj.correctAnswer ? questionObj.correctAnswer.toString().trim() : "";
        let userAnswer = selectedAnswers[`q${index}`] ? selectedAnswers[`q${index}`].toString().trim() : "No answer selected";

        
        function cleanAnswer(answer) {
            return answer
                .replace(/^[A-D][).]\s*/, "") 
                .toLowerCase() 
                .trim();
        }

        let cleanedCorrectAnswer = cleanAnswer(correctAnswer);
        let cleanedUserAnswer = cleanAnswer(userAnswer);

        
        console.log(`Q${index + 1}: ${questionObj.question}`);
        console.log(`✅ Correct Answer: "${correctAnswer}" → Cleaned: "${cleanedCorrectAnswer}"`);
        console.log(`❌ User Selected Answer: "${userAnswer}" → Cleaned: "${cleanedUserAnswer}"`);
        console.log("-------------------------");
        const isCorrect = cleanedCorrectAnswer === cleanedUserAnswer;
        if (isCorrect) score++;

       resultContainer.innerHTML += `
            <li class="result-item">
                <p><strong>Q${index + 1}:</strong> ${questionObj.question}</p>
                <p><strong>Your Answer:</strong> <span class="${isCorrect ? 'correct-answer' : 'wrong-answer'}">${userAnswer}</span></p>
                <p><strong>Correct Answer:</strong> <span class="correct-answer">${correctAnswer}</span></p>
                <p style="color: ${isCorrect ? 'green' : 'red'}; font-weight: bold;">
                    ${isCorrect ? "✔ Correct" : "❌ Incorrect"}
                </p>
                <p>⏱ Time Taken: ${formatTime(questionTimes[index])}</p>
                <hr>
            </li>
        `;
    });

    resultContainer.innerHTML += `
        </ul>
        <h2>🎯 Final Score: ${score} / ${totalQuestions}</h2>
        <h3>⏳ Total Time Taken: ${formatTime(totalTimeTaken)}</h3>
        <button onclick="restartQuiz()" class="restart-btn">🔄 Restart Quiz</button>
    `;

    resultContainer.classList.remove("hidden");
    document.getElementById("quizContainer").classList.add("hidden");
}
document.getElementById("submitQuizBtn").addEventListener("click", submitQuiz);
function generateNavigationPanel() {
    const navPanel = document.getElementById("questionNav");
    navPanel.innerHTML = "";
    questions.forEach((_, index) => {
        const btn = document.createElement("button");
        btn.innerText = index + 1;
        btn.classList.add("nav-btn");
        btn.addEventListener("click", () => {
            saveAnswer();
            currentQuestionIndex = index;
            showQuestion();
        });
        navPanel.appendChild(btn);
    });
}
function highlightActiveQuestion() {
    document.querySelectorAll(".nav-btn").forEach((btn, index) => {
        btn.classList.toggle("active", index === currentQuestionIndex);
    });
}
function restartQuiz() {
    location.reload();
}
