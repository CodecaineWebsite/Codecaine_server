import { pensTable, followsTable } from "../models/schema.js";
import { and, eq, inArray, desc, sql, count } from "drizzle-orm";
import db from "../config/db.js";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import express from "express";

const router = express.Router();

router.get("/pens", verifyFirebase, async (req, res) => {
  const userId = req.userId;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 4, 50);
  const offset = (page - 1) * limit;
  const sort = req.query.sort || "recent"; // "recent" | "top"

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const trendingScore = sql`
  ${pensTable.views_count} * 1 +
  ${pensTable.favorites_count} * 3 +
  ${pensTable.comments_count} * 5 +
  CASE 
    WHEN ${pensTable.created_at} >= ${threeDaysAgo.toISOString()} THEN 10
    ELSE 0
  END
`;

  try {
    // 取追蹤對象
    const followedRows = await db
      .select({ followedId: followsTable.following_id }) // following_id 這個欄位 要改成 followed_id
      .from(followsTable)
      .where(eq(followsTable.follower_id, userId));

    const followedIds = followedRows.map((f) => f.followedId);

    if (followedIds.length === 0) {
      return res.json({
        results: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      });
    }

    // 排序欄位
    const orderBy =
      sort === "top" ? desc(trendingScore) : desc(pensTable.created_at);

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

    const [{ total }] = await db
      .select({ total: count() })
      .from(pensTable)
      .where(
        and(
          inArray(pensTable.user_id, followedIds),
          eq(pensTable.is_private, false),
          eq(pensTable.is_deleted, false)
        )
      );

    res.json({
      results: pens,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("Failed to fetch following pens:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

//TODO: following_id 這個欄位 要改成 followed_id
