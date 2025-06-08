import db from "../config/db.js";
import { pensTable, penTagsTable, tagsTable } from "../models/schema.js";
import { and, eq, ilike, or, asc, desc, sql } from "drizzle-orm";

export async function getMyPens(req, res) {
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
    filters.push(
      or(
        ilike(pensTable.title, `%${q}%`),
        ilike(pensTable.description, `%${q}%`)
      )
    );
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

    let sortColumn = pensTable.created_at;
    if (sortKey === "updated") {
      sortColumn = pensTable.updated_at;
    } else if (sortKey === "popular") {
      sortColumn = pensTable.favorites_count; // 熱門定義需重新調整
    }

    query = query.orderBy(
      orderKey === "asc" ? asc(sortColumn) : desc(sortColumn)
    );

    const pens = await query.limit(limit).offset(offset); // 送出查詢

    // 計算筆數
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

// TODO: 熱門定義需重新調整