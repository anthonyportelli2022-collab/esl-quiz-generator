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

        // Using 1Min AI's current unified chat endpoint and feature type
        const response = await axios.post('https://api.1min.ai/api/chat-with-ai?isStreaming=false', {
            type: "UNIFY_CHAT_WITH_AI",
            model: "gpt-4o-mini",
            promptObject: {
                prompt: promptText
            }
        }, {
            headers: {
                'API-KEY': process.env.ONEMIN_AI_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 25000 
        });

        // Extracting text from 1Min AI's current nested data response structure
        const aiResponseText = response.data?.aiRecord?.aiRecordDetail?.resultObject?.[0] || response.data?.content;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: aiResponseText
        };

    } catch (error) {
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
