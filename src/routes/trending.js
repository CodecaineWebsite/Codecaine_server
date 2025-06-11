import { desc, sql, count, and, eq } from "drizzle-orm";
import { pensTable } from "../models/schema.js";
import db from "../config/db.js";
import express from "express";

const router = express.Router();

router.get("/pens", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 4, 50);
  const offset = (page - 1) * 4;

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // 熱門加權公式：views * 1 + favorites * 3 + comments * 5 + 最近三天作品加十分
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
    const pens = await db
      .select()
      .from(pensTable)
      .where(
        and(eq(pensTable.is_private, false), eq(pensTable.is_deleted, false))
      )
      .orderBy(desc(trendingScore), desc(pensTable.created_at))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(pensTable)
      .where(
        and(eq(pensTable.is_private, false), eq(pensTable.is_deleted, false))
      );

    res.json({
      results: pens,
      total,
      totalPages: Math.ceil(total / 4),
      currentPage: page,
    });
  } catch (err) {
    console.error("Failed to fetch trending pens:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
