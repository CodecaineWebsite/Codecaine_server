import { Router } from "express";
import db from "../config/db.js";
import { pensTable, usersTable } from "../models/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
const router = Router();

/**
 * GET /api/usersCaines
 * 取得該位使用者的所有作品
 */
router.get("/:username/public", async (req, res) => {
  try {
    const { username } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.pageSize) || 6;
    const offset = (page - 1) * limit;

    const targetUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!targetUser.length) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = targetUser[0]?.id;

    const selectPensColumns = {
      id: pensTable.id,
      title: pensTable.title,
      description: pensTable.description,
      is_private: pensTable.is_private,
      created_at: pensTable.created_at,
      updated_at: pensTable.updated_at,
      favorites_count: pensTable.favorites_count,
      comments_count: pensTable.comments_count,
      views_count: pensTable.views_count,
      username: usersTable.username,
      profile_image: usersTable.profile_image_url,
      is_pro: usersTable.is_pro,
    };

    const pens = await db
      .select(selectPensColumns)
      .from(pensTable)
      .innerJoin(usersTable, eq(pensTable.user_id, usersTable.id))
      .where(
        and(eq(pensTable.user_id, userId), eq(pensTable.is_private, false))
      )
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(pensTable)
      .where(
        and(eq(pensTable.user_id, userId), eq(pensTable.is_private, false))
      );
    const count = Number(countResult[0]?.count ?? 0);

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      page,
      results: pens,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/usersCaines
 * 取得該位使用者的私人作品
 */
router.get("/:username/private", verifyFirebase, async (req, res) => {
  try {
    const { username } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.pageSize) || 6;
    const offset = (page - 1) * limit;

    const targetUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (!targetUser.length) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = targetUser[0]?.id;
    console.log("userId:", userId);
    const currentUserId = req.user.uid;
    console.log("currentUserId:", currentUserId);
    if (String(userId) !== String(currentUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const selectPensColumns = {
      id: pensTable.id,
      title: pensTable.title,
      description: pensTable.description,
      is_private: pensTable.is_private,
      created_at: pensTable.created_at,
      updated_at: pensTable.updated_at,
      favorites_count: pensTable.favorites_count,
      comments_count: pensTable.comments_count,
      views_count: pensTable.views_count,
      username: usersTable.username,
      profile_image: usersTable.profile_image_url,
      is_pro: usersTable.is_pro,
    };
    const pens = await db
      .select(selectPensColumns)
      .from(pensTable)
      .innerJoin(usersTable, eq(pensTable.user_id, usersTable.id))
      .where(and(eq(pensTable.user_id, userId), eq(pensTable.is_private, true)))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(pensTable)
      .where(
        and(eq(pensTable.user_id, userId), eq(pensTable.is_private, true))
      );
    const count = Number(countResult[0]?.count ?? 0);
    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      page,
      results: pens,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
export default router;
