import db from "../config/db.js";
import { openAIMessageTable } from "../models/schema.js";
import OpenAI from "openai";
import { eq, asc, desc, and, not } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_HISTORY_LENGTH = 20
const SYSTEM_PROMPT = {
  role: "system",
  content: `你是整合在線上程式編輯器中的 AI 助手，用於協助撰寫 HTML、CSS、JavaScript，並支援 CDN 引入。
    請遵守以下規則：
    1. 僅回應與程式開發、除錯、語法、效能等技術問題。
    2. 程式碼需格式清晰，並附上必要說明。
    3. 回覆時請避免主觀評論、非技術性閒聊、或與開發無關的內容。
    4. HTML 的程式碼回覆僅需提供 &lt;body&gt; 內的內容（不含 &lt;html&gt;、&lt;head&gt; 等）。
    4. 回覆將在 Monaco Editor 中執行，請避免危險指令。
    5. 禁止生成敏感、冒犯、違規內容。
    6. 無法回答時請要求更多細節，不要猜測。
    請以專業、客觀的方式協助使用者。
`
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
      model: "gpt-4o",
      messages: [SYSTEM_PROMPT, ...truncatedHistory],
      max_tokens: 4000,
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
    console.error("AI reply failed:", error?.response?.data || error.message || error);

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