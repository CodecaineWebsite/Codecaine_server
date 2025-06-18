import { GoogleGenerativeAI } from '@google/generative-ai';
import "dotenv/config"; // Ensure dotenv config is loaded for process.env

// Get the API key from environment variables.
// 'dotenv/config' should be imported in your server.js or directly here if this is the first module loaded
// that uses process.env for the API key. It's usually handled in the main entry file (server.js).
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY is not set. Please check your .env file and server.js configuration.");
    // In a real application, you might throw an error or handle this more robustly.
    // For now, the app will likely crash or throw an error when trying to use 'undefined' API_KEY.
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);

// Define the model you want to use for general content generation.
// 'gemini-1.5-flash' is often a good choice for quick, cost-effective text generation.
// If you specifically need 'gemini-2.5-flash', make sure it's available in your region/project.
const generationModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const chat = chatModel.startChat({
  history: [ // 這個陣列定義了 AI 應該「知道」的初始對話訊息。
    {
      role: "user", // 表示訊息的發送者 (使用者)。
      parts: [{ text: "跟我解釋const filters = [eq(pensTable.user_id, userId),eq(pensTable.is_deleted, false),eq(pensTable.is_trash, false),];" }],
    },
    {
      role: "model", // 表示訊息的發送者 (AI 模型)。
      parts: [{ text: "These lines of code are creating an array called filters. This array is designed to hold conditions that will likely be used to filter data from a database table, probably named pensTable." }],
    },
  ],
});


/**
 * Handles incoming requests to generate text using the Gemini API's generateContent method.
 * This function is for single-turn text generation (not multi-turn chat).
 *
 * @param {Object} req - Express request object. Expects req.body.prompt.
 * @param {Object} res - Express response object.
 */
export async function generateText(req, res) {
    // Correctly extract the 'prompt' from the request body sent by the frontend.
    const { prompt } = {prompt: "我剛剛問什麼"};

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ error: 'Prompt is required and cannot be empty.' });
    }

    try {
        // Call the generateContent method on the specific model instance.
        // The 'contents' field should be an array of parts, as typically expected by Gemini API.
        const result = await chat.sendMessage(prompt);

        // Get the response object and extract the generated text.
        const response = await result.response;
        const generatedContent = response.text();

        // Send the generated text back to the frontend.
        res.json({ generatedText: generatedContent });

    } catch (error) {
        console.error('Error calling Gemini API for text generation:', error);
        // Provide more descriptive error messages.
        res.status(500).json({
            error: `Failed to generate content from Gemini.`,
            details: error.message,
            // Include stack in development for debugging.
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}