import { followsTable } from '../models/schema.js';
import db from '../config/db.js';
import { eq } from 'drizzle-orm';

export async function injectFollowedIds(req, res, next) {
  try {
    const userId = req.userId;

    const rows = await db
      .select({ id: followsTable.following_id })
      .from(followsTable)
      .where(eq(followsTable.follower_id, userId));

    req.followedIds = rows.map((r) => r.id);
    next();
  } catch (err) {
    console.error("Failed to inject followed IDs:", err);
    next(err);
  }
}