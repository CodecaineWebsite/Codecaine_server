import db from "../config/db.js";
import { pensTable, usersTable } from "../models/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { selectPensColumns } from "../queries/pensSelect.js";
import { publicPensFilters } from "../utils/filters.js";
const filters = publicPensFilters();
const selectCainesColumns = { ...selectPensColumns };
// 查詢作品欄位

/**
 * GET /api/usersCaines/:username/public
 * 取得該位使用者的所有公開作品
 */
export async function getUserPublicCaines(req, res) {
  try {
    const { username } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = req.query.view === "table" ? 15 : 6;
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

    const Caines = await db
      .select(selectCainesColumns)
      .from(pensTable)
      .innerJoin(usersTable, eq(pensTable.user_id, usersTable.id))
      .where(and(eq(pensTable.user_id, userId), ...filters))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(pensTable)
      .where(and(eq(pensTable.user_id, userId), ...filters));
    const count = Number(countResult[0]?.count ?? 0);

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      page,
      results: Caines,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/usersCaines/:username/private
 * 取得該位使用者的所有私人作品（需驗證身份）
 */
export async function getUserPrivateCaines(req, res) {
  try {
    const { username } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = req.query.view === "table" ? 15 : 6;
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
    const currentUserId = req.user.uid;
    if (String(userId) !== String(currentUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const Caines = await db
      .select(selectCainesColumns)
      .from(pensTable)
      .innerJoin(usersTable, eq(pensTable.user_id, usersTable.id))
      .where(
        and(
          eq(pensTable.user_id, userId),
          eq(pensTable.is_private, true),
          eq(pensTable.is_deleted, false),
          eq(pensTable.is_trash, false)
        )
      )
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(pensTable)
      .where(
        and(
          eq(pensTable.user_id, userId),
          eq(pensTable.is_private, true),
          eq(pensTable.is_deleted, false),
          eq(pensTable.is_trash, false)
        )
      );
    const count = Number(countResult[0]?.count ?? 0);

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      page,
      results: Caines,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
