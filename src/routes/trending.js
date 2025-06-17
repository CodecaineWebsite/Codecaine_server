import { desc, sql, count, and, eq } from "drizzle-orm";
import { pensTable, usersTable } from "../models/schema.js";
import { validatePaginationParams } from "../middlewares/validatePaginationParams.js";
import db from "../config/db.js";
import express from "express";

const router = express.Router();

router.get("/pens", validatePaginationParams, async (req, res) => {
  const { page, limit, offset } = req.pagination;
  
  const selectPensColumns = {
    id: pensTable.id,
    title: pensTable.title,
    description: pensTable.description,
    html_code: pensTable.html_code,
    css_code: pensTable.css_code,
    js_code: pensTable.js_code,
    resources_css: pensTable.resources_css,
    resources_js: pensTable.resources_js,
    is_private: pensTable.is_private,
    created_at: pensTable.created_at,
    updated_at: pensTable.updated_at,
    favorites_count: pensTable.favorites_count,
    comments_count: pensTable.comments_count,
    views_count: pensTable.views_count,
    username: usersTable.username,
    user_display_name: usersTable.display_name,
    profile_image: usersTable.profile_image_url,
    is_pro: usersTable.is_pro,
  }; // 要查詢的欄位

  // 搜尋條件陣列：初始條件： 非刪除 + 非私有 + 非垃圾桶
  const filters = [
    eq(pensTable.is_private, false),
    eq(pensTable.is_deleted, false),
    eq(pensTable.is_trash, false),
  ];

  // 熱門加權公式：views * 1 + favorites * 3 + comments * 5 + 最近三天作品加十分
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
    const pens = await db
      .select(selectPensColumns)
      .from(pensTable)
      .leftJoin(usersTable, eq(pensTable.user_id, usersTable.id))
      .where(and(...filters))
      .orderBy(desc(trendingScore), desc(pensTable.created_at))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(pensTable)
      .where(and(...filters));

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
