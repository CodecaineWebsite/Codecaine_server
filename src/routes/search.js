import express from "express";
import db from "../config/db.js";
import { sql, count, like, or, eq, and } from "drizzle-orm";
import { pensTable, usersTable } from "../models/schema.js";
import { validatePaginationParams } from "../middlewares/validatePaginationParams.js";
import { paginateResponse } from "../utils/paginationResponse.js";
import { buildKeywordConditions } from "../utils/search.js";
import { publicPensFilters } from "../utils/filters.js";
import { selectPensColumns } from "../queries/pensSelect.js";

const router = express.Router();

const categoryMap = {
  doses: {
    table: pensTable,
    select: selectPensColumns,
    extraFilters: publicPensFilters(), // 私有／刪除／垃圾桶排除
    defaultLimit: 6,
  },
  // 其他分類擴充
};

/**
 * /api/search/:category?q=xxx&page=yyy
 */
router.get("/:category", validatePaginationParams, async (req, res) => {
  const { category } = req.params;
  const { q = ""} = req.query;
  const { page, limit: userLimit = 6 } = req.pagination;

  // 1. 驗證分類
  const meta = categoryMap[category];
  if (!meta) return res.status(400).json({ error: "Invalid Category" });

  const limit = meta.defaultLimit ?? userLimit;
  const table = meta.table;
  const offset = (page - 1) * limit;

  try {
    // 2. 關鍵字處理
    const keywords = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const keywordConditions = buildKeywordConditions(keywords, table);

    // 3. where 條件
    const filters = [...meta.extraFilters, ...keywordConditions];

    const whereClause = and(...filters);
    // 4. total 筆數
    const [{ total }] = await db
      .select({ total: count() })
      .from(table)
      .leftJoin(usersTable, eq(table.user_id, usersTable.id))
      .where(whereClause);

    // 5. 分頁檢查
    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = page > totalPages ? 1 : page;
    const trueOffset = (currentPage - 1) * limit;

    // 6. 查詢結果
    const results = await db
      .select(meta.select)
      .from(table)
      .leftJoin(usersTable, eq(table.user_id, usersTable.id))
      .where(whereClause)
      .orderBy(table.created_at)
      .limit(limit)
      .offset(trueOffset);

    // 7. 回傳
    res.json(
      paginateResponse({
        data: results,
        total,
        page: currentPage,
        limit,
      })
    );
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
