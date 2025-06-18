import express from "express";
// Correctly import the named export 'generateText' from your controller
import { generateText } from '../controllers/geminiController.js';

const router = express.Router(); // Create a new router instance

// Define the POST request handler for the '/generate' path.
// The full path will be /api/gemini/generate (because of app.use('/api/gemini', geminiRoutes) in server.js)
router.post('/generate', generateText);

// If you have other Gemini-related routes in the future, add them here.
// For example, if you wanted a streaming endpoint:
// import { generateTextStream } from '../controllers/geminiController.js';
// router.post('/generate-stream', generateTextStream);

export default router; // Export the router instance