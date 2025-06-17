import { pensTable, followsTable, usersTable } from "../models/schema.js";
import { and, eq, inArray, desc, sql, count } from "drizzle-orm";
import db from "../config/db.js";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import express from "express";

const router = express.Router();

router.get("/pens", verifyFirebase, async (req, res) => {
  const userId = req.userId;

  const rawPage = parseInt(req.query.page, 10);
  const rawLimit = parseInt(req.query.limit, 10);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 50 ? rawLimit : 4;
  const offset = (page - 1) * limit;
  const sort = req.query.sort || "recent"; // "recent" | "top"

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
      .select(selectPensColumns)
      .from(pensTable)
      .where(
        and(
          inArray(pensTable.user_id, followedIds),
          ...filters
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
          ...filters
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
