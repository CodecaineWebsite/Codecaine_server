import { pensTable, followsTable } from "../models/schema.js";
import { and, eq, inArray, sql, desc } from "drizzle-orm";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import db from "../config/db.js";
import express from "express";

const router = express.Router();

router.get("/pens", verifyFirebase, async (req, res) => {
  const userId = req.userId;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 4, 50);
  const offset = (page - 1) * limit;
  const sort = req.query.sort || "top"; // "recent" | "top"

  try {
    // 找出使用者追蹤的作者 ID 列表
    let followed;
    try {
      followed = await db
        .select({ followedId: followsTable.following_id })
        .from(followsTable)
        .where(eq(followsTable.follower_id, userId));
    } catch (err) {
      console.error("找出使用者追蹤的作者 ID 列表失敗:", err);
      res.status(500).json({ error: "找出使用者追蹤的作者 ID 列表失敗" });
    }

    const followedIds = followed.map((f) => f.followedId);

    if (followedIds.length === 0) {
      return res.json({ results: [], total: 0 });
    }

    // 排序依據
    let orderBy;
    if (sort === "top") {
      orderBy = desc(
        sql`(${pensTable.views_count} * 1 + ${pensTable.favorites_count} * 3 + ${pensTable.comments_count} * 5)`
      );
    } else {
      orderBy = desc(pensTable.created_at); // recent
    }

    // 查資料
    const pens = await db
      .select()
      .from(pensTable)
      .where(
        and(
          inArray(pensTable.user_id, followedIds),
          eq(pensTable.is_private, false),
          eq(pensTable.is_deleted, false)
        )
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // 取得總數（可選）
    const [{ count: total }] = await db
      .select({ count: sql`COUNT(*)` })
      .from(pensTable)
      .where(inArray(pensTable.user_id, followedIds));

    return res.json({ results: pens, total });
  } catch (err) {
    console.error("取得追蹤作品失敗:", err);
    res.status(500).json({ error: "取得追蹤作品失敗" });
  }
});

export default router;

// TODO: followsTable.following_id 欄位語意不清， following_id 改成 followed_id
