import db from "../config/db.js";
import { openAIMessageTable } from "../models/schema.js";
import OpenAI from "openai";
import { eq, asc, desc, and, not } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_HISTORY_LENGTH = 20
const SYSTEM_PROMPT = {
  role: "system",
  content: `你是整合在一個線上程式編輯器中的 AI 助手。
    使用者可以編寫 HTML、CSS、JavaScript，並能引入 CDN。
    請協助使用者撰寫程式碼、除錯、或回答相關問題。
    你所傳入的程式碼會在Monaco Editor中執行`
};

export const handleAIReply = async (chatId, userMessageId) => {
  try {
    if (!chatId || isNaN(Number(chatId))) {
      console.warn("Reply: Invalid chat", chatId);
      return;
    }
    const history = await db
      .select({
        role: openAIMessageTable.role,
        content: openAIMessageTable.content,
      })
      .from(openAIMessageTable)
      .where(
        and(
          eq(openAIMessageTable.chat_id, chatId),
          not(eq(openAIMessageTable.status, 3))
        )
      )
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
      messages: [SYSTEM_PROMPT, ...truncatedHistory],
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

    const updatedUserMsg = await db
      .select()
      .from(openAIMessageTable)
      .where(eq(openAIMessageTable.id, userMessageId))
      .limit(1);
  
    return [updatedUserMsg[0], insertedAssistant[0]];

  } catch (error) {
    console.error("AI reply failed:", error);

    // 取得最新 user 訊息
    const lastUserMsg = await db
      .select()
      .from(openAIMessageTable)
      .where(eq(openAIMessageTable.chat_id, chatId))
      .orderBy(desc(openAIMessageTable.message_index))
      .limit(1);

    let updatedUserMsg = null;

    // 如果最後一則是 user 訊息，更新它的狀態為 3，並重新撈最新資料
    if (lastUserMsg.length && lastUserMsg[0].role === 'user') {
      await db
        .update(openAIMessageTable)
        .set({ status: 3 })
        .where(eq(openAIMessageTable.id, userMessageId));

      // 重新撈取更新後的 user 訊息
      const updatedUserMsgs = await db
        .select()
        .from(openAIMessageTable)
        .where(eq(openAIMessageTable.id, userMessageId))
        .limit(1);

      updatedUserMsg = updatedUserMsgs[0];
    }

    // 插入錯誤訊息為 assistant 回覆
    const errorMessage = "AI was unable to respond. Please try again later.";
    const lastMessageIndex = lastUserMsg.length ? lastUserMsg[0].message_index : 0;

    const [errorReply] = await db.insert(openAIMessageTable).values({
      chat_id: chatId,
      role: "assistant",
      content: errorMessage,
      created_at: new Date(),
      status: 3,
      message_index: lastMessageIndex + 1,
    }).returning();

    return [updatedUserMsg, errorReply];
  }
};