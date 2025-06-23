import db from "../config/db.js";
import { openAIMessageTable } from "../models/schema.js";
import OpenAI from "openai";
import { eq, asc, desc } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_HISTORY_LENGTH = 20

export const handleAIReply = async (chatId) => {
  try {
    if (!chatId || isNaN(Number(chatId))) {
      console.warn("handleAIReply: 無效的 chatId", chatId);
      return;
    }
    const history = await db
      .select({
        role: openAIMessageTable.role,
        content: openAIMessageTable.content,
      })
      .from(openAIMessageTable)
      .where(eq(openAIMessageTable.chat_id, chatId))
      .orderBy(asc(openAIMessageTable.message_index));

    if (history.length === 0) return;
    const truncatedHistory = history.slice(-MAX_HISTORY_LENGTH);

    const lastMessage = await db
      .select()
      .from(openAIMessageTable)
      .where(eq(openAIMessageTable.chat_id, chatId))
      .orderBy(desc(openAIMessageTable.message_index))
      .limit(1);

    const nextIndex = lastMessage.length > 0 ? lastMessage[0].message_index + 1 : 1;

    // 呼叫 OpenAI
    const result = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: truncatedHistory,
      max_tokens: 200,
      temperature: 0.2,
    });

    const reply = result.choices[0].message.content;

    // 存 assistant 訊息
    const insertedAssistant = await db
      .insert(openAIMessageTable)
      .values({
        chat_id: chatId,
        role: "assistant",
        content: reply,
        created_at: new Date(),
        status: 1,
        message_index: nextIndex,
      })
      .returning();

    return insertedAssistant[0];

  } catch (error) {
    console.error("AI 回覆失敗:", error);
  }
};