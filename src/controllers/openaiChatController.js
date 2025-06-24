import { eq, desc, asc, and } from "drizzle-orm";
import db from "../config/db.js";

import { openAIChatTable, openAIMessageTable } from "../models/schema.js";

import { handleAIReply } from "../services/aiReplyService.js";

export const getChats = async (req, res) => {
  try {
    const userId = req.userId;

    const chats = await db
      .select({
        id: openAIChatTable.id,
        title: openAIChatTable.title,
        createdAt: openAIChatTable.created_at,
      })
      .from(openAIChatTable)
      .where(and(
        eq(openAIChatTable.user_id, userId),
        eq(openAIChatTable.status, 1),
      ))
      .orderBy(desc(openAIChatTable.created_at));

    res.status(200).json({ chats });
  } catch (error) {
    console.error('取得聊天列表失敗:', error);
    res.status(500).json({ error: '取得聊天列表失敗' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const chatId = Number(req.params.chatId);
    const userId = req.userId;

    if (!chatId || isNaN(chatId)) {
      return res.status(400).json({ error: "無效的 chatId" });
    }

    // 確認這筆 chat 是這位 user 的
    const chat = await db
      .select()
      .from(openAIChatTable)
      .where(and(
        eq(openAIChatTable.id, chatId),
        eq(openAIChatTable.user_id, userId)
      ))
      .limit(1);

    if (chat.length === 0) {
      return res.status(404).json({ error: "找不到這筆聊天或沒有權限" });
    }

    // 查詢所有訊息
    const messages = await db
      .select({
        id: openAIMessageTable.id,
        role: openAIMessageTable.role,
        content: openAIMessageTable.content,
        createdAt: openAIMessageTable.created_at,
        status: openAIMessageTable.status,
        messageIndex: openAIMessageTable.message_index,
      })
      .from(openAIMessageTable)
      .where(eq(openAIMessageTable.chat_id, chatId))
      .orderBy(asc(openAIMessageTable.created_at)); // 時間升冪排序

    res.status(200).json({ messages });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "取得訊息失敗" });
  }
};

export const addNewChat = async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();

    const inserted = await db
      .insert(openAIChatTable)
      .values({
        user_id: userId,
        title: 'New Chat',
        created_at: now,
        status: 1, // 表示存在
      })
      .returning({
        id: openAIChatTable.id,
        user_id: openAIChatTable.user_id,
        title: openAIChatTable.title,
        created_at: openAIChatTable.created_at,
        status: openAIChatTable.status,
      });

    const newChat = inserted[0];

    res.status(201).json({
      success: true,
      chat: newChat,
    });
  } catch (error) {
    console.error('新增聊天失敗:', error);
    res.status(500).json({ error: '新增聊天失敗' });
  }
};

export const addNewMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId, role, content } = req.body;

    if (!chatId || isNaN(Number(chatId))) {
      return res.status(400).json({ error: "無效的 chatId" });
    }
    if (role !== "user") {
      return res.status(400).json({ error: "目前僅支援 user 角色送訊息" });
    }
    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "訊息內容不可為空" });
    }

    // 確認 chat 屬於該 user
    const chat = await db
      .select()
      .from(openAIChatTable)
      .where(and(eq(openAIChatTable.id, chatId), eq(openAIChatTable.user_id, userId)))
      .limit(1);

    if (chat.length === 0) {
      return res.status(404).json({ error: "找不到該聊天或無權限" });
    }

    // 取得該 chat 最新的 message_index，決定下一筆 index
    const lastMessage = await db
      .select()
      .from(openAIMessageTable)
      .where(eq(openAIMessageTable.chat_id, chatId))
      .orderBy(desc(openAIMessageTable.message_index))
      .limit(1);

    const messageIndex = lastMessage.length > 0 ? lastMessage[0].message_index + 1 : 1;

    if (messageIndex === 1 && chat[0].title === 'New Chat' && content.trim()) {
      const newTitle = content.trim().slice(0, 30);
      await db
        .update(openAIChatTable)
        .set({ title: newTitle })
        .where(eq(openAIChatTable.id, chatId));
    }

    // 新增 user 訊息（status 預設 1）
    const insertedUser = await db
      .insert(openAIMessageTable)
      .values({
        chat_id: chatId,
        role: "user",
        content: content.trim(),
        created_at: new Date(),
        status: 1,
        message_index: messageIndex,
      })
      .returning({
        id: openAIMessageTable.id,
        chatId: openAIMessageTable.chat_id,
        role: openAIMessageTable.role,
        content: openAIMessageTable.content,
        createdAt: openAIMessageTable.created_at,
        status: openAIMessageTable.status,
        messageIndex: openAIMessageTable.message_index,
      });

    const userMessageId = insertedUser[0].id;
    const assistantMessages = await handleAIReply(chatId, userMessageId);

    return res.status(201).json({
      messages: [assistantMessages[0], assistantMessages[1]],
    });

  } catch (error) {
    console.error("新增訊息失敗:", error);
    res.status(500).json({ error: "新增訊息失敗" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chatId = Number(req.params.chatId);
    const userId = req.userId;

    if (!chatId || isNaN(chatId)) {
      return res.status(400).json({ error: "無效的 chatId" });
    }

    // 確認 chat 是否存在且屬於該 user
    const chat = await db
      .select()
      .from(openAIChatTable)
      .where(and(
        eq(openAIChatTable.id, chatId),
        eq(openAIChatTable.user_id, userId)
      ))
      .limit(1);

    if (chat.length === 0) {
      return res.status(404).json({ error: "找不到該聊天或無權限" });
    }

    // 可選：刪除所有相關 messages（若 DB 沒設 ON DELETE CASCADE）
    await db
      .delete(openAIMessageTable)
      .where(eq(openAIMessageTable.chat_id, chatId));

    // 刪除 chat
    await db
      .update(openAIChatTable)
      .set({ status: 2 })
      .where(eq(openAIChatTable.id, chatId));

    res.status(200).json({ success: true, message: "聊天已刪除" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "刪除聊天失敗" });
  }
}

export const renameChat = async (req, res) => {
  try {
    const chatId = Number(req.params.chatId);
    const userId = req.userId;
    const { title } = req.body;

    if (!chatId || isNaN(chatId)) {
      return res.status(400).json({ error: "無效的 chatId" });
    }

    if (!title || typeof title !== 'string' || title.trim() === "") {
      return res.status(400).json({ error: "請提供有效的標題" });
    }

    // 確認 chat 屬於這位 user
    const chat = await db
      .select()
      .from(openAIChatTable)
      .where(and(
        eq(openAIChatTable.id, chatId),
        eq(openAIChatTable.user_id, userId)
      ))
      .limit(1);

    if (chat.length === 0) {
      return res.status(404).json({ error: "找不到該聊天或無權限" });
    }

    // 更新 title
    await db
      .update(openAIChatTable)
      .set({ title: title.trim() })
      .where(eq(openAIChatTable.id, chatId));

    res.status(200).json({ success: true, message: "標題已更新" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "修改標題失敗" });
  }
}