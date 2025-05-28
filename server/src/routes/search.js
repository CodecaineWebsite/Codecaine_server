import express from "express";
import db from "../config/db.js";
import { sql, count, like, or, eq } from "drizzle-orm";
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
  const { q = "", rawPage = "1" } = req.query;
  const page = parseInt(rawPage, 10);
  const table = categoryMap[category];
  const keyword = `%${q.toLowerCase()}%`;
  const limit = 6;
  const offset = (page - 1) * limit;

  if (!table) return res.status(400).json({ error: "無效的分類" });

  try {
    const [countRow] = await db
      .select({ count: count() })
      .from(pensTable)
      .leftJoin(usersTable, eq(pensTable.user_id, usersTable.id))
      .where(
        or(
          like(sql`LOWER(${pensTable.title})`, keyword),
          like(sql`LOWER(${pensTable.description})`, keyword),
          like(sql`LOWER(${usersTable.username})`, keyword)
        )
      );

    const total = countRow.count;
    const totalPages = Math.ceil(total / limit);

    const results = await db
      .select({
        id: pensTable.id,
        title: pensTable.title,
        description: pensTable.description,
        created_at: pensTable.created_at,
        username: usersTable.username,
      })
      .from(table)
      .leftJoin(usersTable, eq(pensTable.user_id, usersTable.id))
      .where(
        or(
          like(sql`LOWER(${table.title})`, keyword),
          like(sql`LOWER(${table.description})`, keyword),
          like(sql`LOWER(${usersTable.username})`, keyword)
        )
      )
      .orderBy(table.created_at)
      .limit(limit)
      .offset(offset);

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
