import db from "../config/db.js";
import { pensTable, penTagsTable, tagsTable } from "../models/schema.js";
import { and, eq, ilike, or, asc, desc, sql } from "drizzle-orm";

export async function searchMyWork(req, res) {
  const userId = req.userId; // 由 verifyFirebase middleware 注入
  const {
    q = "",
    privacy = "all",
    tag,
    sort = "updated",
    order = "desc",
    view = "card",
    page: rawPage = "1",
  } = req.query;

  const validSorts = ["created", "updated", "popular"];
  const validOrders = ["asc", "desc"];
  const sortKey = validSorts.includes(sort) ? sort : "created";
  const orderKey = validOrders.includes(order) ? order : "desc";

  const page = parseInt(rawPage, 10) || 1;
  const limit = view === "table" ? 10 : 6;
  const offset = (page - 1) * limit;

  // 搜尋條件陣列：初始條件：自己的作品 + 非刪除
  const filters = [
    eq(pensTable.user_id, userId),
    eq(pensTable.is_deleted, false),
  ];

  // 關鍵字搜尋
  // 若關鍵字為空則略過空字串或全空白的搜尋，則不會加入搜尋條件 (撈出所有資料)
  if (q.trim()) {
    const keywords = q.toLowerCase().trim().split(/\s+/).filter(Boolean);

    const keywordConditions = keywords.map((kw) =>
      or(
        ilike(pensTable.title, `%${kw}%`),
        ilike(pensTable.description, `%${kw}%`)
      )
    );

    filters.push(and(...keywordConditions));
  }

  // 隱私過濾 (預設已為ALL)
  if (privacy === "public") filters.push(eq(pensTable.is_private, false));
  if (privacy === "private") filters.push(eq(pensTable.is_private, true));

  try {
    let query; // 建立查詢語句

    // 若要過濾標前則 join tag 表
    if (tag) {
      query = db
        .select()
        .from(pensTable)
        .leftJoin(penTagsTable, eq(pensTable.id, penTagsTable.pen_id))
        .leftJoin(tagsTable, eq(penTagsTable.tag_id, tagsTable.id));

      filters.push(eq(tagsTable.name, tag));
    } else {
      query = db.select().from(pensTable);
    }

    query = query.where(and(...filters));

    // 設定排序條件
    let sortColumn = pensTable.created_at;
    if (sortKey === "updated") {
      sortColumn = pensTable.updated_at;
    } else if (sortKey === "popular") {
      sortColumn = sql`
    (${pensTable.views_count} * 1) +
    (${pensTable.favorites_count} * 3) +
    (${pensTable.comments_count} * 5) + 
    (CASE
    WHEN ${pensTable.created_at} > NOW() - interval '3 days' THEN 10
    ELSE 0
    END)`;

      // 熱門權重分數加權 views * 1 + favorites * 3 + comments * 5 + 三天內新作品加 10 分
    }

    // 加入排序條件
    const isAsc = orderKey === "asc";
    query = query.orderBy(
      isAsc ? asc(sortColumn) : desc(sortColumn), // 第一排序
      isAsc ? asc(pensTable.created_at) : desc(pensTable.created_at) // 第二排序
    );

    // 執行查詢
    const pens = await query.limit(limit).offset(offset);

    // 設定筆數查詢條件
    let countQuery = db.select({ count: sql`COUNT(*)` }).from(pensTable);

    if (tag) {
      countQuery = countQuery
        .leftJoin(penTagsTable, eq(pensTable.id, penTagsTable.pen_id))
        .leftJoin(tagsTable, eq(penTagsTable.tag_id, tagsTable.id));
    }

    countQuery = countQuery.where(and(...filters));

    const [{ count }] = await countQuery;

    res.json({
      total: count,
      page,
      hasNextPage: offset + pens.length < count,
      results: pens,
    });
  } catch (err) {
    console.error("取得使用者作品失敗", err);
    res.status(500).json({ error: "伺服器錯誤，無法取得作品列表" });
  }
}

export async function getUserTags(req, res) {

  const userId = req.userId;

  try {
    const tags = await db
      .selectDistinct(({ name: tagsTable.name }))
      .from(pensTable)
      .innerJoin(penTagsTable, eq(pensTable.id, penTagsTable.pen_id))
      .innerJoin(tagsTable, eq(penTagsTable.tag_id, tagsTable.id))
      .where(and(eq(pensTable.user_id, userId), eq(pensTable.is_deleted, false)));

    res.json(tags.map((t) => t.name)); // 回傳純陣列 ["Vue", "CSS", ...]
  } catch (err) {
    console.error("取得使用者 tags 失敗", err);
    res.status(500).json({ error: "伺服器錯誤，無法取得 tags" });
  }
}