import { or, like, sql } from "drizzle-orm";
import { usersTable } from "../models/schema.js";

/**
 * 把關鍵字陣列轉成 LIKE 條件陣列
 * @param {string[]} keywords
 * @param {Table} table - drizzle-orm 定義的資料表
 */
export function buildKeywordConditions(keywords, table) {
  return keywords.map((kw) =>
    or(
      like(sql`LOWER(${table.title})`, `%${kw}%`),
      like(sql`LOWER(${table.description})`, `%${kw}%`),
      like(sql`LOWER(${usersTable.username})`, `%${kw}%`)
    )
  );
}