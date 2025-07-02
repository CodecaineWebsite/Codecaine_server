import db from "../config/db.js";
import { commentsTable, pensTable, usersTable } from "../models/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { createNotification } from "../utils/createNotification.js";

// GET /api/comments?pen_id=xxx
export async function getComments(req, res) {
  const pen_id = parseInt(req.query.pen_id, 10);

  if (Number.isNaN(pen_id)) {
    return res
      .status(400)
      .json({ error: "Missing or invalid pen_id parameter" });
  }
  try {
    const existingPen = await db
      .select()
      .from(pensTable)
      .where(eq(pensTable.id, pen_id))
      .limit(1);

    if (existingPen.length === 0) {
      return res.status(404).json({ error: "Pen not found" });
    }

    const comments = await db
      .select({
        id: commentsTable.id,
        content: commentsTable.content,
        created_at: commentsTable.created_at,
        user: {
          id: usersTable.id,
          username: usersTable.username,
          display_name: usersTable.display_name,
          profile_image_url: usersTable.profile_image_url,
        },
      })
      .from(commentsTable)
      .where(eq(commentsTable.pen_id, pen_id))
      .leftJoin(usersTable, eq(commentsTable.user_id, usersTable.id))
      .orderBy(desc(commentsTable.created_at));

    return res.status(200).json(comments);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/comments
export async function postComment(req, res) {
  const { pen_id: rawPenId, content } = req.body;
  const user_id = req.userId; // 從驗證中獲取用戶ID
  const pen_id = parseInt(rawPenId, 10);
  if (Number.isNaN(pen_id) || !content) {
    return res
      .status(400)
      .json({ error: "Please provide valid pen_id and content" });
  }

  const existing = await db
    .select()
    .from(pensTable)
    .where(eq(pensTable.id, pen_id))
    .limit(1);

  if (existing.length === 0) {
    return res.status(404).json({ error: "Pen not found" });
  }

  try {
    const [newComment] = await db
      .insert(commentsTable)
      .values({ pen_id, user_id, content })
      .returning();

    await db
      .update(pensTable)
      .set({ comments_count: sql`${pensTable.comments_count} + 1` })
      .where(eq(pensTable.id, pen_id));

    const pen = existing[0];
    if (pen.user_id && pen.user_id !== user_id) {
      await createNotification({
        recipientId: pen.user_id,
        senderId: user_id,
        type: "comment",
        penId: pen_id,
        commentId: newComment.id,
      });
    }

    const [user] = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        profile_image_url: usersTable.profile_image_url,
      })
      .from(usersTable)
      .where(eq(usersTable.id, user_id))
      .limit(1);

    return res.status(201).json({
      id: newComment.id,
      content: newComment.content,
      created_at: newComment.created_at,
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// PUT /api/comments/:id
export async function updateComment(req, res) {
  const comment_id = parseInt(req.params.id);
  const { content } = req.body;
  const user_id = req.userId; // 從驗證中獲取用戶ID
  if (Number.isNaN(comment_id) || !content) {
    return res
      .status(400)
      .json({ error: "Please provide valid comment_id and content" });
  }

  try {
    const existing = await db
      .select()
      .from(commentsTable)
      .where(
        and(
          eq(commentsTable.id, comment_id),
          eq(commentsTable.user_id, user_id)
        )
      );

    if (existing.length === 0)
      return res
        .status(403)
        .json({ error: "No permission to edit this comment" });

    const [updated] = await db
      .update(commentsTable)
      .set({ content })
      .where(eq(commentsTable.id, comment_id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Comment not found" });

    const [commentWithUser] = await db
      .select({
        id: commentsTable.id,
        content: commentsTable.content,
        created_at: commentsTable.created_at,
        user: {
          id: usersTable.id,
          username: usersTable.username,
          display_name: usersTable.display_name,
          profile_image_url: usersTable.profile_image_url,
        },
      })
      .from(commentsTable)
      .where(eq(commentsTable.id, comment_id))
      .leftJoin(usersTable, eq(commentsTable.user_id, usersTable.id));

    return res.json(commentWithUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE /api/comments/:id
export async function deleteComment(req, res) {
  const comment_id = parseInt(req.params.id);
  const user_id = req.userId;
  if (Number.isNaN(comment_id)) {
    return res.status(400).json({ error: "Invalid comment ID" });
  }

  try {
    const [existing] = await db
      .select({
        id: commentsTable.id,
        pen_id: commentsTable.pen_id,
      })
      .from(commentsTable)
      .where(
        and(
          eq(commentsTable.id, comment_id),
          eq(commentsTable.user_id, user_id)
        )
      );

    if (!existing) {
      return res
        .status(403)
        .json({ error: "No permission to delete this comment" });
    }

    const { pen_id } = existing;
    await db.delete(commentsTable).where(eq(commentsTable.id, comment_id));

    await db
      .update(pensTable)
      .set({ comments_count: sql`${pensTable.comments_count} - 1` })
      .where(eq(pensTable.id, pen_id));

    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
