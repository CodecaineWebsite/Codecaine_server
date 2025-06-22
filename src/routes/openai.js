import express from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import { checkIsPro } from "../middlewares/checkIsPro.js";

import { getChats, getMessages, deleteChat, renameChat, addNewChat, addNewMessage } from "../controllers/openaiChatController.js";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post('/chats', [ verifyFirebase, checkIsPro ], addNewChat);
router.get('/chats', [ verifyFirebase, checkIsPro ], getChats);
router.get('/messages/:chatId', [ verifyFirebase, checkIsPro ], getMessages);
router.delete('/chats/:chatId', [ verifyFirebase, checkIsPro ], deleteChat);
router.patch('/chats/:chatId', [ verifyFirebase, checkIsPro ], renameChat);

router.post('/message', [ verifyFirebase, checkIsPro ], addNewMessage);

export default router;
