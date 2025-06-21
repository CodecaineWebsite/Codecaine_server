import express from "express";
import OpenAI from "openai";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import { checkIsPro } from "../middlewares/checkIsPro.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default router;
