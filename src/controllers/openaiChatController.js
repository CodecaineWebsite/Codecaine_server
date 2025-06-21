import { eq, and, sql } from "drizzle-orm";
import db from "../config/db.js";
import { openAIChatTable, openAIMessageTable } from "../models/schema.js";

export const addNewChat = async (req, res) => {
  try {
    const { pen_id, firstMessage } = req.body;
    const user_id = req.user.id;

    // 建立 chat
    const [newChat] = await db.insert(openAIChatTable)
      .values({
        pen_id,
        user_id,
        title: 'untitled',
      })
      .returning();

    // 如果有第一則訊息，就順便建立
    if (firstMessage) {
      await db.insert(openAIMessageTable).values({
        chat_id: newChat.id,
        content: firstMessage,
        role: 'user',
      });
    }

    res.status(201).json({ chat: newChat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '建立聊天失敗' });
  }
};

// export const addNewMessage = async (req, res) => {
//   try {
    
//   } catch (err) {
    
//   }
// };

// export const getChats = async (req, res) => {
//   try {
    
//   } catch (err) {
    
//   }
// };


// export const getMessages = async (req, res) => {
//   try {
    
//   } catch (err) {
    
//   }
// };

// export const deleteChat = async (req, res) => {
//   try {
//     const { chatId } = req.params
//     // 檢查該 chat 是否屬於該 user，再刪除
//     await db.delete(openAIChatTable).where(eq(openAIChatTable.id, chatId))
//     res.status(200).json({ message: 'Chat deleted' })
//   } catch (err) {
//     res.status(500).json({ error: '刪除失敗' })
//   }
// }

// export const renameChat = async (req, res) => {
//   try {
//     const { chatId } = req.params
//     const { title } = req.body
//     await db.update(openAIChatTable)
//       .set({ title })
//       .where(eq(openAIChatTable.id, chatId))
//     res.status(200).json({ message: 'Title updated' })
//   } catch (err) {
//     res.status(500).json({ error: '更新失敗' })
//   }
// }