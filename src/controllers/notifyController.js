import { eq, desc } from "drizzle-orm";
import db from "../config/db.js";
import {
  notificationsTable,
  usersTable,
  pensTable,
  commentsTable,
} from "../models/schema.js";

/**
 * GET /api/notify
 * 取得所有通知
 */
export async function getNotifications(req, res, next) {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const notifications = await db
      .select({
        id: notificationsTable.id,
        type: notificationsTable.type,
        is_read: notificationsTable.is_read,
        created_at: notificationsTable.created_at,

        sender_id: usersTable.id,
        sender_username: usersTable.username,
        sender_display_name: usersTable.display_name,
        sender_profile_image: usersTable.profile_image_url,

        pen_id: pensTable.id,
        pen_title: pensTable.title,

        comment_id: commentsTable.id,
        comment_content: commentsTable.content,
      })
      .from(notificationsTable)
      .innerJoin(usersTable, eq(notificationsTable.sender_id, usersTable.id))
      .leftJoin(pensTable, eq(notificationsTable.pen_id, pensTable.id))
      .leftJoin(
        commentsTable,
        eq(notificationsTable.comment_id, commentsTable.id)
      )
      .where(eq(notificationsTable.recipient_id, userId))
      .orderBy(desc(notificationsTable.created_at));

    const formatted = notifications.map((n) => ({
      type: n.type,
      is_read: n.is_read,
      created_at: n.created_at,
      sender: {
        username: n.sender_username,
        display_name: n.sender_display_name,
        profile_image_url: n.sender_profile_image,
      },
      pen: n.pen_id
        ? {
            title: n.pen_title,
          }
        : null,
      comment: n.comment_id
        ? {
            content: n.comment_content,
          }
        : null,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/notify/read-all
 * 全部標記為已讀
 */
export async function markAllAsRead(req, res) {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await db
      .update(notificationsTable)
      .set({ is_read: true })
      .where(eq(notificationsTable.recipient_id, userId));

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
}
