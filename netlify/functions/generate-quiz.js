const axios = require('axios');

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { exam, topic, cefr } = JSON.parse(event.body);

        const promptText = `Act as an expert ESL material writer and senior examiner for ${exam}. 
Generate an original reading comprehension exercise based on these variables:
- Topic: ${topic}
- Language Difficulty: Strict ${cefr} level grammar and vocabulary constraints.

Output Constraints:
1. Write an original reading passage of exactly 180 to 220 words.
2. Generate exactly 5 questions matching standard ${exam} question styles (e.g., Multiple Choice).
3. Return your response strictly as a raw JSON object with this exact structure:
{
  "passage": "The text...",
  "questions": [
    { "id": 1, "text": "Question?", "options": ["A", "B", "C", "D"], "correct_answer": "A" }
  ]
}`;

        // Connects to the 1Min AI feature node
        const response = await axios.post('https://api.1min.ai/api/features', {
            type: "CHAT_WITH_AI",
            model: "gpt-4o-mini",
            promptObject: {
                prompt: promptText,
                isMixed: false,
                imageList: [],
                webSearch: false
            }
        }, {
            headers: {
                'API-KEY': process.env.ONEMIN_AI_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // Prevents hanging endlessly
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: response.data.content
        };

    } catch (error) {
        // Built-in diagnostics to capture exact issues
        const errorData = error.response ? JSON.stringify(error.response.data) : error.message;
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                error: "Diagnostic Report", 
                details: errorData,
                keyDetails: process.env.ONEMIN_AI_KEY ? "Key is loaded in Netlify" : "Key is MISSING/EMPTY in Netlify"
            })
        };
    }
};