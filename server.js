require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai"); 
const bodyParser = require("body-parser");

const app = express();
const port = 3000;
app.use(cors());
app.use(bodyParser.json()); 

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function fetchGeminiQuestions(classLevel, subject, chapter, topic, difficulty, numQuestions) {
    const prompt = `Generate ${numQuestions} multiple-choice questions for class ${classLevel} on subject ${subject}, chapter ${chapter}, topic ${topic} with ${difficulty} difficulty. Provide four options per question and mark the correct answer. Format response as a JSON array: [{ "question": "Question text", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }]`;

    try {
        console.log("Sending request to Gemini API...");
        const result = await model.generateContent(prompt);

     
        console.log("Gemini API Raw Response:", result);

      
        const responseText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error("No response received from Gemini API.");

        console.log(" Extracted Response:", responseText);

        
        const cleanedResponse = responseText.replace(/```json|```/g, "").trim();

      
        let questions;
        try {
            questions = JSON.parse(cleanedResponse);
        } catch (jsonError) {
            console.error(" JSON Parsing Error:", jsonError.message);
            throw new Error("Failed to parse Gemini API response.");
        }

      
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("No valid questions extracted from response.");
        }

        console.log(" Parsed Questions:", questions);
        return questions;
    } catch (error) {
        console.error("Error fetching questions:", error.message);
        throw new Error("Failed to fetch questions from Gemini API.");
    }
}


app.post("/generate-quiz", async (req, res) => {
    console.log(" Request Received:", req.body);

    const { classLevel, subject, chapter, topic, difficulty, numQuestions } = req.body;

    
    if (!classLevel || !subject || !chapter || !topic || !difficulty || !numQuestions) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const questions = await fetchGeminiQuestions(classLevel, subject, chapter, topic, difficulty, numQuestions);
        res.json({ questions });
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: "Failed to generate quiz." });
    }
});

app.get("/", (req, res) => {
    res.send("Server is running with Gemini API!");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

