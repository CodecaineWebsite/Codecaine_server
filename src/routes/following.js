import { pensTable, followsTable, usersTable } from "../models/schema.js";
import { and, eq, inArray, desc, sql, count } from "drizzle-orm";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import { validatePaginationParams } from "../middlewares/validatePaginationParams.js";
import { publicPensFilters } from "../utils/filters.js";
import { selectPensColumns, trendingScore } from "../queries/pensSelect.js";
import db from "../config/db.js";
import express from "express";

const router = express.Router();

router.get(
  "/pens",
  verifyFirebase,
  validatePaginationParams,
  async (req, res) => {
    const userId = req.userId;
    const { page, limit, offset } = req.pagination;

    const sort = req.query.sort || "recent"; // "recent" | "top"

    // 搜尋條件陣列：初始條件： 非刪除 + 非私有 + 非垃圾桶
    const filters = [
      ...publicPensFilters(),
    ];


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
      
      filters.push(inArray(pensTable.user_id, followedIds));
      // 排序欄位
      const orderBy =
        sort === "top" ? desc(trendingScore()) : desc(pensTable.created_at);

      const pens = await db
        .select(selectPensColumns)
        .from(pensTable)
        .leftJoin(usersTable, eq(pensTable.user_id, usersTable.id))
        .leftJoin(
          followsTable,
          eq(pensTable.user_id, followsTable.following_id)
        )
        .where(and(inArray(pensTable.user_id, followedIds), ...filters))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const [{ total }] = await db
        .select({ total: count() })
        .from(pensTable)
        .leftJoin(usersTable, eq(pensTable.user_id, usersTable.id))
        .leftJoin(
          followsTable,
          eq(pensTable.user_id, followsTable.following_id)
        )
        .where(and(...filters));

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
  }
);

export default router;

//TODO: following_id 這個欄位 要改成 followed_id
