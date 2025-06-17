import  db from '../config/db.js';
import { and, desc, eq, sql, inArray } from 'drizzle-orm';
import { pensTable, usersTable } from '../models/schema.js';
import { publicPensFilters } from "../utils/filters.js";
import { selectPensColumns, trendingScore } from '../queries/pensSelect.js';

export async function listFollowedPens({ followedIds, limit, offset, sort }) {
  if (!followedIds || followedIds.length === 0) {
    return [];
  }

  const orderBy = sort === 'top' ? desc(trendingScore()) : desc(pensTable.created_at);

  return db
    .select(selectPensColumns)
    .from(pensTable)
    .leftJoin(usersTable, eq(pensTable.user_id, usersTable.id))
    .where(and(inArray(pensTable.user_id, followedIds), ...publicPensFilters()))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}