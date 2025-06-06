import express from "express";
import db from "../config/db.js";
import { sql, count, like, or, eq, and } from "drizzle-orm";
import { pensTable, usersTable } from "../models/schema.js";

const router = express.Router();

const categoryMap = {
  pens: pensTable,
};

/**
 * /api/search/:category?q=xxx&page=yyy
 */
router.get("/:category", async (req, res) => {
  const { category } = req.params;
  const { q = "", page: rawPage = "1" } = req.query;
  const page = parseInt(rawPage, 10);
  const table = categoryMap[category];
  const limit = 6;
  const offset = (page - 1) * limit;

  // const keyword = `%${q.toLowerCase()}%`;

  if (!table) return res.status(400).json({ error: "無效的分類" });

  const keywords = q.toLowerCase().trim().split(/\s+/).filter(Boolean); // .filter(Boolean) === .filter((item) => Boolean(item))

  const keywordConditions = keywords.map((kw) =>
    or(
      like(sql`LOWER(${table.title})`, `%${kw}%`),
      like(sql`LOWER(${table.description})`, `%${kw}%`),
      like(sql`LOWER(${usersTable.username})`, `%${kw}%`)
    )
  );

  const whereClause = and(...keywordConditions);
  try {

    let total;
    let totalPages;

    try {
      const [countRow] = await db
        .select({ count: count() })
        .from(table)
        .leftJoin(usersTable, eq(table.user_id, usersTable.id))
        .where(whereClause);

      total = Number(countRow.count);
      totalPages = Math.ceil(total / limit);
    } catch (err) {
      console.error("搜尋總筆數錯誤:", err);
      return res.status(500).json({ error: "無法取得搜尋筆數" });
    }

    let results = [];

    try {
      results = await db
        .select({
          id: table.id,
          title: table.title,
          description: table.description,
          created_at: table.created_at,
          username: usersTable.username,
        })
        .from(table)
        .leftJoin(usersTable, eq(table.user_id, usersTable.id))
        .where(whereClause)
        .orderBy(table.created_at)
        .limit(limit)
        .offset(offset);
    } catch (err) {
      console.error("搜尋結果查詢錯誤:", err);
      return res.status(500).json({ error: "無法取得搜尋結果" });
    }

    res.json({
      results,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("搜尋錯誤:", err);
    res.status(500).json({ error: "搜尋失敗" });
  }
  //查總筆數
  //查總頁數
  //查當頁資料
  //回傳當頁資料
});

export default router;

// TODO: 當 :category 為 categoryMap 之外的值，當成 pens 來處理搜尋
