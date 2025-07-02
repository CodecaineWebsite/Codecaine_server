import db from "../config/db.js";
import { notificationsTable } from "../models/schema.js"; // 注意副檔名是 .js

/**
 * @typedef {'follow' | 'favorite' | 'comment'} NotificationType
 */

/**
 * 建立一筆通知
 * @param {Object} params
 * @param {string} params.recipientId - 接收者 ID
 * @param {string} params.senderId - 發出通知的使用者 ID
 * @param {NotificationType} params.type - 通知類型
 * @param {number} [params.penId] - 作品 ID（可選）
 * @param {number} [params.commentId] - 留言 ID（可選）
 */
export async function createNotification({
  recipientId,
  senderId,
  type,
  penId,
  commentId,
}) {
  // 不要通知自己
  if (recipientId === senderId) return;

  await db.insert(notificationsTable).values({
    recipient_id: recipientId,
    sender_id: senderId,
    type,
    pen_id: penId,
    comment_id: commentId,
    created_at: new Date(),
  });
}
